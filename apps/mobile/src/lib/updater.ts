import Constants from 'expo-constants';
import { Alert, Linking } from 'react-native';
import * as Updates from 'expo-updates';

export type GitHubRelease = {
  tagName: string;
  name: string;
  body: string;
  apkUrl: string | null;
  htmlUrl: string;
};

export async function checkGitHubUpdates(repoOwnerAndName: string = 'JAWA/shafaq-monorepo'): Promise<GitHubRelease | null> {
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
        apkUrl: apkAsset ? apkAsset.browser_download_url : data.html_url,
        htmlUrl: data.html_url,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export async function promptUpdateIfAvailable(repoOwnerAndName: string = 'JAWA/shafaq-monorepo') {
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
    Alert.alert(
      'تحديث جديد متوفر 🚀',
      `${update.body}\n\nالإصدار الجديد: ${update.tagName}`,
      [
        { text: 'لاحقاً', style: 'cancel' },
        {
          text: 'تنزيل التحديث الآن',
          onPress: () => {
            Linking.openURL(update.apkUrl!);
          },
        },
      ]
    );
  }
}

function isNewerVersion(current: string, latest: string): boolean {
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
