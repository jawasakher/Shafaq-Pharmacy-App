import Constants from 'expo-constants';
import { Alert } from 'react-native';
import * as Updates from 'expo-updates';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';

export type GitHubRelease = {
  tagName: string;
  name: string;
  body: string;
  apkUrl: string | null;
  htmlUrl: string;
};

export async function cleanupOldApks() {
  try {
    const dirs = [FileSystem.Paths.document?.uri, FileSystem.Paths.cache?.uri];
    for (const dir of dirs) {
      if (!dir) continue;
      const files = await FileSystem.readDirectoryAsync(dir);
      for (const file of files) {
        if (file.startsWith('shafaq-update-') && file.endsWith('.apk')) {
          await FileSystem.deleteAsync(`${dir}${file}`, { idempotent: true }).catch(() => {});
        }
      }
    }
  } catch (e) {
    console.warn('APK cleanup failed:', e);
  }
}

export async function checkGitHubUpdates(repoOwnerAndName: string = 'jawasakher/Shafaq-Pharmacy-App'): Promise<GitHubRelease | null> {
  try {
    const currentVersion = Constants.expoConfig?.version || '1.0.0';
    const response = await fetch(`https://api.github.com/repos/${repoOwnerAndName}/releases/latest`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const latestVersion = data.tag_name ? data.tag_name.replace(/^v/, '') : '';

    if (latestVersion && isNewerVersion(currentVersion, latestVersion)) {
      const apkAsset = Array.isArray(data.assets)
        ? data.assets.find((asset: any) => asset.name.endsWith('.apk'))
        : null;

      return {
        tagName: data.tag_name,
        name: data.name || `تحديث جديد ${data.tag_name}`,
        body: data.body || 'يتوفر تحديث جديد لتطبيق شَفَق مع تحسينات وإصلاحات جديدة.',
        apkUrl: apkAsset ? apkAsset.browser_download_url : null,
        htmlUrl: data.html_url,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export async function promptUpdateIfAvailable(repoOwnerAndName: string = 'jawasakher/Shafaq-Pharmacy-App') {
  try {
    // 1. Silent OTA Update check first
    if (!__DEV__) {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        Alert.alert(
          'تحديث هوائي 🚀',
          'تم تحميل تحديثات جديدة لتحسين أداء التطبيق. هل ترغب في إعادة التشغيل لتطبيقها الآن؟',
          [
            { text: 'لاحقاً', style: 'cancel' },
            { text: 'إعادة التشغيل', onPress: () => Updates.reloadAsync() },
          ]
        );
        return; // If OTA is available and downloaded, skip APK prompt
      }
    }
  } catch (e) {
    console.warn('OTA update check failed:', e);
  }

  // 2. APK Update check
  const update = await checkGitHubUpdates(repoOwnerAndName);
  if (update && update.apkUrl) {
    const ignoredVersion = await SecureStore.getItemAsync('@shafaq_ignored_update_version');
    if (ignoredVersion === update.tagName) {
      return; // Do not nag the user if they already pressed "Later" for this version
    }

    Alert.alert(
      'تحديث جديد متوفر 🚀',
      `${update.body}\n\nالإصدار الجديد: ${update.tagName}`,
      [
        {
          text: 'لاحقاً',
          style: 'cancel',
          onPress: async () => {
            await SecureStore.setItemAsync('@shafaq_ignored_update_version', update.tagName);
          }
        },
        {
          text: 'مراجعة التحديث',
          onPress: () => {
             import('expo-router').then(({ router }) => router.push('/update' as any));
          },
        },
      ]
    );
  }
}

export function isNewerVersion(current: string, latest: string): boolean {
  const cParts = current.split('.').map((p) => parseInt(p, 10) || 0);
  const lParts = latest.split('.').map((p) => parseInt(p, 10) || 0);

  for (let i = 0; i < Math.max(cParts.length, lParts.length); i++) {
    const c = cParts[i] || 0;
    const l = lParts[i] || 0;
    if (l > c) return true;
    if (c > l) return false;
  }

  return false;
}

export function validateChecksumFormat(sha256: string | undefined | null): boolean {
  if (!sha256 || typeof sha256 !== 'string' || sha256.length !== 64 || !/^[a-fA-F0-9]{64}$/.test(sha256)) {
    return false;
  }
  return true;
}

export function validateReleaseContract(release: { availableVersion?: string; artifactUrl?: string | null; sha256?: string }) {
  if (!release.availableVersion || typeof release.availableVersion !== 'string' || release.availableVersion.trim() === '') {
    throw new Error('Malformed version string');
  }
  if (!release.artifactUrl) {
    throw new Error('Missing APK asset');
  }
  if (!validateChecksumFormat(release.sha256)) {
    throw new Error('Missing or malformed checksum');
  }
  return true;
}
