import { Injectable, Logger } from '@nestjs/common';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class UpdatesService {
  private readonly logger = new Logger(UpdatesService.name);
  private expo = new Expo();

  constructor(private readonly prisma: PrismaService) {}

  async getLatestRelease(platform: string = 'android', currentVersion: string = '1.0.0') {
    // Determine release dynamically based on GitHub API in a real implementation.
    // Here we provide the validated baseline release info:
    const latestVersion = '1.0.5';
    const versionCode = 5;
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
      releaseNotes: 'تحديث جديد لتطبيق شَفَق. تم إضافة نظام الإشعارات والتحديثات التلقائية المباشرة لتحسين أداء وتجربة التطبيق.',
      artifactUrl: 'https://github.com/jawasakher/Shafaq-Pharmacy-App/releases/latest/download/shafaq.apk',
      sha256: 'VERIFY_DOWNLOADED_CHECKSUM',
      publishedAt: new Date().toISOString(),
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
