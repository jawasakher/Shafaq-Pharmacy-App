import { useEffect, useState, useRef } from 'react';
import { Alert, StyleSheet, View, ActivityIndicator, AppState, AppStateStatus } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import * as IntentLauncher from 'expo-intent-launcher';
import * as SecureStore from 'expo-secure-store';
import * as Network from 'expo-network';
import { ScrollView } from 'react-native-gesture-handler';

import { BrandEmblem } from '@/components/ui/brand-logo';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecondaryButton } from '@/components/ui/secondary-button';
import { ShafaqCard } from '@/components/ui/shafaq-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiRequest } from '@/services/api-client';

type ReleaseInfo = {
  currentVersion: string;
  availableVersion: string;
  hasUpdate: boolean;
  mandatory: boolean;
  releaseNotes: string;
  artifactUrl: string;
  sha256?: string;
};

export default function UpdateScreen() {
  const [release, setRelease] = useState<ReleaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [statusText, setStatusText] = useState('');

  const downloadResumableRef = useRef<any | null>(null);
  const appState = useRef(AppState.currentState);

  const currentVersion = Constants.expoConfig?.version || '1.0.0';

  useEffect(() => {
    async function fetchUpdateInfo() {
      try {
        const res = await apiRequest<{
          success: boolean;
          data: ReleaseInfo;
        }>(`/app-updates/latest?platform=android&version=${currentVersion}`);

        if (res.success && res.data) {
          setRelease(res.data);
        }
      } catch (error) {
        // Only set fallback if absolutely necessary to prevent UI crashes
        setRelease({
          currentVersion,
          availableVersion: currentVersion,
          hasUpdate: false,
          mandatory: false,
          releaseNotes: 'تعذر الاتصال بخادم التحديثات. تأكد من اتصالك بالإنترنت.',
          artifactUrl: '',
        });
      } finally {
        setLoading(false);
      }
    }
    fetchUpdateInfo();
  }, [currentVersion]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/active/) &&
        (nextAppState === 'background' || nextAppState === 'inactive')
      ) {
        // App is going to background
        if (isDownloading && downloadResumableRef.current) {
          try {
            await downloadResumableRef.current.pauseAsync();
            setStatusText('تم إيقاف التحميل مؤقتاً (التطبيق في الخلفية)...');
          } catch (e) {
            console.warn('Failed to pause download', e);
          }
        }
      } else if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground
        if (isDownloading && downloadResumableRef.current) {
          try {
            // Check network before resuming
            const networkState = await Network.getNetworkStateAsync();
            if (networkState.isConnected && networkState.isInternetReachable !== false) {
               await downloadResumableRef.current.resumeAsync();
               setStatusText(`جاري استئناف التحميل... ${Math.round(downloadProgress * 100)}%`);
            } else {
               setStatusText('انقطع الاتصال، في انتظار الشبكة...');
            }
          } catch (e) {
            console.warn('Failed to resume download', e);
          }
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isDownloading, downloadProgress]);

  // Network listener
  useEffect(() => {
    let prevConnected = true;
    const interval = setInterval(async () => {
      if (!isDownloading || !downloadResumableRef.current) return;

      const networkState = await Network.getNetworkStateAsync();
      const isConnected = networkState.isConnected && networkState.isInternetReachable !== false;

      if (!isConnected && prevConnected) {
        prevConnected = false;
        try {
          await downloadResumableRef.current.pauseAsync();
          setStatusText('انقطع الاتصال، في انتظار الشبكة...');
        } catch (e) {
          console.warn('Failed to pause on disconnect', e);
        }
      } else if (isConnected && !prevConnected) {
        prevConnected = true;
        try {
          if (appState.current === 'active') {
            await downloadResumableRef.current.resumeAsync();
            setStatusText(`جاري استئناف التحميل... ${Math.round(downloadProgress * 100)}%`);
          }
        } catch (e) {
          console.warn('Failed to resume on reconnect', e);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isDownloading, downloadProgress]);

  const handleDownloadAndInstall = async () => {
    if (!release?.artifactUrl) {
      Alert.alert('خطأ', 'رابط التحديث غير متوفر. يرجى المحاولة لاحقاً.');
      return;
    }

    try {
      setIsDownloading(true);
      setStatusText('جاري التحميل...');
      setDownloadProgress(0);

      const fileUri = `${FileSystem.Paths.document?.uri ?? FileSystem.Paths.cache?.uri}shafaq-update-${release.availableVersion}.apk`;

      const downloadResumable = FileSystem.createDownloadResumable(
        release.artifactUrl,
        fileUri,
        {},
        (progress: any) => {
          const percent = progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
          setDownloadProgress(percent);
          setStatusText(`جاري التحميل... ${Math.round(percent * 100)}%`);
        }
      );

      downloadResumableRef.current = downloadResumable;

      const downloadResult = await downloadResumable.downloadAsync();
      if (!downloadResult || !downloadResult.uri) throw new Error('فشل التحميل، يرجى التحقق من الشبكة.');

      setStatusText('جاري التحقق من أمان الملف (SHA-256)...');

      // If backend provided a SHA-256 hash, verify it securely using expo-crypto
      if (release.sha256) {
        const fileBase64 = await FileSystem.readAsStringAsync(downloadResult.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const fileHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, fileBase64);

        if (fileHash.toLowerCase() !== release.sha256.toLowerCase()) {
          throw new Error('فشل التحقق من أمان الملف. قد يكون الملف تالفاً.');
        }
      }

      setStatusText('جاري التثبيت...');

      // Get Content URI for secure Android 11+ Intent Launcher installation
      const contentUri = await FileSystem.getContentUriAsync(downloadResult.uri);

      try {
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
          type: 'application/vnd.android.package-archive',
        });
      } catch (installError) {
        Alert.alert(
          'صلاحية التثبيت مطلوبة',
          'يرجى الانتقال إلى إعدادات الهاتف والسماح بتثبيت التطبيقات من مصادر غير معروفة (Install Unknown Apps)، ثم حاول التثبيت مجدداً.'
        );
      } finally {
        // Cleanup immediately after intent completes or fails to prevent storage bloat
        await FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => {});
      }

      setIsDownloading(false);
    } catch (error: any) {
      setIsDownloading(false);
      setStatusText('');
      Alert.alert('خطأ في التحميل', error.message || 'حدث خطأ أثناء تحميل التحديث.');
    }
  };

  const handleLater = async () => {
    if (release?.availableVersion) {
      await SecureStore.setItemAsync('@shafaq_ignored_update_version', release.availableVersion);
    }
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.emblemCircle}>
              <BrandEmblem size={64} color="#19A9CC" />
            </View>
            <ThemedText style={styles.title}>تحديث تطبيق شَفَق</ThemedText>
            <ThemedText style={styles.subtitle}>نورُ الرعاية الطبية - الإصدار الحديث</ThemedText>
          </View>

          <ShafaqCard variant="elevated" style={styles.card}>
            <View style={styles.versionRow}>
              <View style={styles.versionCol}>
                <ThemedText style={styles.versionLabel}>الإصدار الحالي</ThemedText>
                <ThemedText style={styles.versionValue}>{currentVersion}</ThemedText>
              </View>
              <View style={styles.versionDivider} />
              <View style={styles.versionCol}>
                <ThemedText style={styles.versionLabel}>الإصدار المتوفر</ThemedText>
                <ThemedText style={styles.versionValueNew}>
                  {release?.availableVersion || currentVersion}
                </ThemedText>
              </View>
            </View>

            <View style={styles.notesBox}>
              <ThemedText style={styles.notesTitle}>ملاحظات الإصدار:</ThemedText>
              <ThemedText style={styles.notesText}>
                {loading ? 'جاري التحقق من التحديثات...' : release?.releaseNotes}
              </ThemedText>
            </View>

            <View style={styles.actionGroup}>
              {release?.hasUpdate ? (
                isDownloading ? (
                  <View style={styles.progressContainer}>
                    <ActivityIndicator size="small" color="#19A9CC" />
                    <ThemedText style={styles.progressText}>{statusText}</ThemedText>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${downloadProgress * 100}%` }]} />
                    </View>
                  </View>
                ) : (
                  <PrimaryButton
                    title="تثبيت التحديث الآن"
                    onPress={handleDownloadAndInstall}
                  />
                )
              ) : (
                <PrimaryButton
                  title="التطبيق محدث"
                  onPress={() => router.back()}
                  disabled={true}
                />
              )}

              {!release?.mandatory && !isDownloading && (
                <SecondaryButton
                  title="لاحقاً (متابعة الاستخدام)"
                  onPress={handleLater}
                />
              )}
            </View>
          </ShafaqCard>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4FCFE',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    justifyContent: 'center',
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  emblemCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#BDE8EF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#19A9CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#16485C',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#688795',
    textAlign: 'center',
  },
  card: {
    borderColor: '#BDE8EF',
    gap: 20,
    paddingVertical: 24,
  },
  versionRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FAFD',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D9EEF4',
  },
  versionCol: {
    flex: 1,
    alignItems: 'center',
  },
  versionDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#BDE8EF',
  },
  versionLabel: {
    fontSize: 12,
    color: '#688795',
    marginBottom: 4,
  },
  versionValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16485C',
  },
  versionValueNew: {
    fontSize: 16,
    fontWeight: '900',
    color: '#19A9CC',
  },
  notesBox: {
    gap: 8,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D9EEF4',
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16485C',
    textAlign: 'right',
  },
  notesText: {
    fontSize: 13,
    color: '#688795',
    textAlign: 'right',
    lineHeight: 22,
  },
  actionGroup: {
    gap: 12,
  },
  progressContainer: {
    padding: 16,
    backgroundColor: '#F0FAFD',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BDE8EF',
    alignItems: 'center',
    gap: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#16485C',
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    width: '100%',
    backgroundColor: '#D9EEF4',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#19A9CC',
  },
});
