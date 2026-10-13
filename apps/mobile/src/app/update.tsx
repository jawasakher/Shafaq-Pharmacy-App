import { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { router } from 'expo-router';

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
};

export default function UpdateScreen() {
  const [release, setRelease] = useState<ReleaseInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const currentVersion = Constants.expoConfig?.version || '1.0.4';

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
      } catch {
        // Fallback default release info if offline
        setRelease({
          currentVersion,
          availableVersion: '1.0.4',
          hasUpdate: false,
          mandatory: false,
          releaseNotes: 'أنت تستخدم أحدث إصدار مستقر من تطبيق شَفَق.',
          artifactUrl: 'https://github.com/jawasakher/Shafaq-Pharmacy-App/releases/latest',
        });
      } finally {
        setLoading(false);
      }
    }
    fetchUpdateInfo();
  }, [currentVersion]);

  const handleUpdate = () => {
    const url = release?.artifactUrl || 'https://github.com/jawasakher/Shafaq-Pharmacy-App/releases/latest';
    Linking.openURL(url).catch(() => {
      Alert.alert('خطأ', 'تعذر فتح رابط التحديث، يرجى زيارة صفحة الإصدارات مباشرة.');
    });
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
              <PrimaryButton
                title="تحديث الآن (تحميل APK)"
                onPress={handleUpdate}
              />

              {!release?.mandatory && (
                <SecondaryButton
                  title="لاحقاً (متابعة الاستخدام)"
                  onPress={() => router.back()}
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
});
