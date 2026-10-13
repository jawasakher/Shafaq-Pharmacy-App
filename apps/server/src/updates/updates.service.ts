import { Injectable, Logger } from '@nestjs/common';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class UpdatesService {
  private readonly logger = new Logger(UpdatesService.name);
  private expo = new Expo();

  constructor(private readonly prisma: PrismaService) {}

  async getLatestRelease(platform: string = 'android', currentVersion: string = '1.0.0') {
    let latestVersion = '1.0.6';
    let versionCode = 6;
    let minSupportedVersion = '1.0.0';
    let artifactUrl = 'https://github.com/jawasakher/Shafaq-Pharmacy-App/releases/latest/download/shafaq.apk';
    let sha256 = '06631908ef574080cb9c9485083f25956a4a2e3c92218acbb8a600319e1275d1';
    let artifactSize = 112388821;
    let publishedAt = '2026-10-13T14:10:43Z';
    let releaseNotes = 'تحديث جديد لتطبيق شَفَق. تم إصلاح نظام الإشعارات وتأكيد الموثوقية التقنية للنسخة.';

    try {
      // Dynamically fetch authoritative release metadata from GitHub
      const res = await fetch('https://api.github.com/repos/jawasakher/Shafaq-Pharmacy-App/releases/latest');
      if (res.ok) {
        const data = await res.json();
        const apkAsset = data.assets?.find((a: any) => a.name === 'shafaq.apk');

        if (data.tag_name && apkAsset && apkAsset.state === 'uploaded') {
          latestVersion = data.tag_name.replace('v', '');
          artifactUrl = apkAsset.browser_download_url;
          artifactSize = apkAsset.size;
          publishedAt = data.published_at;

          if (apkAsset.digest && apkAsset.digest.startsWith('sha256:')) {
            sha256 = apkAsset.digest.replace('sha256:', '');
          }
        }
      }
    } catch {
      this.logger.warn('Failed to fetch dynamic release info, using verified v1.0.6 fallback data.');
    }

    const isMandatory = compareVersions(currentVersion, minSupportedVersion) < 0;
    const hasUpdate = compareVersions(currentVersion, latestVersion) < 0;

    return {
      platform,
      currentVersion,
      availableVersion: latestVersion,
      versionCode,
      hasUpdate,
      mandatory: isMandatory,
      releaseNotes,
      artifactUrl,
      sha256,
      artifactSize,
      publishedAt,
    };
  }

  async registerPushToken(userId: string | undefined, token: string, platform: string) {
    if (!userId) {
      return { registered: false, reason: 'unauthenticated' };
    }

    if (!Expo.isExpoPushToken(token)) {
      this.logger.warn(`Invalid Expo push token received: ${token}`);
      return { registered: false, reason: 'invalid_token_format' };
    }

    try {
      await this.prisma.deviceToken.upsert({
        where: { token },
        create: {
          userId,
          token,
          platform,
        },
        update: {
          userId,
          platform,
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Successfully registered push token for user ${userId}`);
      return { registered: true, userId, platform };
    } catch (error: any) {
      this.logger.error(`Failed to register push token: ${error?.message || error}`);
      return { registered: false, reason: 'db_error' };
    }
  }

  async unregisterPushToken(token: string) {
    try {
      await this.prisma.deviceToken.delete({
        where: { token },
      });
      return { unregistered: true };
    } catch {
      return { unregistered: false };
    }
  }

  async sendReleaseNotification(version: string, releaseNotes: string) {
    const devices = await this.prisma.deviceToken.findMany();

    if (devices.length === 0) {
      this.logger.log('No devices registered for push notifications.');
      return { sent: 0, failures: 0 };
    }

    const messages: ExpoPushMessage[] = devices.map(device => ({
      to: device.token,
      sound: 'default',
      title: 'تحديث جديد لتطبيق شفق',
      body: `الإصدار ${version} متاح الآن: ${releaseNotes}`,
      data: { type: 'update_available', version },
      channelId: 'app_updates',
    }));

    const chunks = this.expo.chunkPushNotifications(messages);
    let successCount = 0;
    let failureCount = 0;

    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        for (const ticket of ticketChunk) {
          if (ticket.status === 'error') {
            failureCount++;
            this.logger.warn(`Push notification failed: ${ticket.message}`);
          } else {
            successCount++;
          }
        }
      } catch (error: any) {
        this.logger.error(`Failed to send push notification chunk: ${error?.message || error}`);
        failureCount += chunk.length;
      }
    }

    this.logger.log(`Sent release notifications: ${successCount} successful, ${failureCount} failed.`);
    return { sent: successCount, failures: failureCount };
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
