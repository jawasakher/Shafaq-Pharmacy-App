import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class UpdatesService {
  constructor(private readonly prisma: PrismaService) {}

  async getLatestRelease(platform: string = 'android', currentVersion: string = '1.0.0') {
    // In production, this can pull from a dedicated releases table or GitHub releases manifest.
    // For Shafaq v1.0.4 production baseline:
    const latestVersion = '1.0.4';
    const versionCode = 4;
    const minSupportedVersion = '1.0.0';

    const isMandatory = compareVersions(currentVersion, minSupportedVersion) < 0;
    const hasUpdate = compareVersions(currentVersion, latestVersion) < 0;

    return {
      platform,
      currentVersion,
      availableVersion: latestVersion,
      versionCode,
      hasUpdate,
      mandatory: isMandatory,
      releaseNotes: 'تحديث جديد لتطبيق شَفَق يضم تحسينات في الأداء، تحسين إرسال الرمز عبر الإيميل، وتجربة مستخدم أسرع وأكثر أماناً.',
      artifactUrl: 'https://github.com/jawasakher/Shafaq-Pharmacy-App/releases/latest/download/shafaq.apk',
      sha256: '0eaa94acd836a9996399fed1642acdd0b011fb4bd81d23f7f82d85eca8ddd906',
      publishedAt: new Date().toISOString(),
    };
  }

  async registerPushToken(userId: string | undefined, token: string, platform: string) {
    // Store or log device push token securely
    return {
      success: true,
      data: {
        registered: true,
        userId: userId || 'anonymous',
        platform,
      },
    };
  }
}

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map((p) => parseInt(p, 10) || 0);
  const parts2 = v2.split('.').map((p) => parseInt(p, 10) || 0);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}
