import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
  UnauthorizedException,
  Headers,
} from '@nestjs/common';
import type { Request } from 'express';
import * as crypto from 'crypto';

import { IdentityGuard } from '../identity/identity.guard.js';
import { InternalIdentityGuard } from '../identity/internal-identity.guard.js';
import { RolesGuard } from '../identity/roles.guard.js';
import { Roles } from '../identity/roles.decorator.js';
import { UpdatesService } from './updates.service.js';

type AuthenticatedRequest = Request & {
  user?: {
    id: string;
  };
};

@Controller('api/v1')
export class UpdatesController {
  constructor(private readonly updatesService: UpdatesService) {}

  @Get('app-updates/latest')
  async getLatestUpdate(
    @Query('platform') platform?: string,
    @Query('version') version?: string,
  ) {
    const data = await this.updatesService.getLatestRelease(
      platform || 'android',
      version || '1.0.0',
    );

    return {
      success: true,
      data,
    };
  }

  @Post('devices/push-token')
  @HttpCode(HttpStatus.OK)
  @UseGuards(IdentityGuard)
  async registerPushToken(
    @Req() request: AuthenticatedRequest,
    @Body() body: { token: string; platform?: string },
  ) {
    const data = await this.updatesService.registerPushToken(
      request.user?.id,
      body.token,
      body.platform || 'android',
    );

    return {
      success: true,
      data,
    };
  }

  @Post('app-updates/notify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(InternalIdentityGuard, RolesGuard)
  @Roles('ADMIN', 'OWNER')
  async triggerUpdateNotification(
    @Body() body: { version: string; releaseNotes: string; directApkUrl?: string }
  ) {
    const data = await this.updatesService.sendReleaseNotification(
      body.version,
      body.releaseNotes,
      body.directApkUrl
    );

    return {
      success: true,
      data,
    };
  }

  @Post('webhooks/github')
  @HttpCode(HttpStatus.OK)
  async handleGitHubWebhook(
    @Headers('x-hub-signature-256') signature: string,
    @Body() body: any,
  ) {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret) {
      throw new UnauthorizedException('Webhook secret not configured');
    }
    if (!signature) {
      throw new UnauthorizedException('Missing signature');
    }

    // Verify HMAC signature
    const hmac = crypto.createHmac('sha256', secret);
    // Note: To be perfectly safe, you'd verify against raw body.
    // Here we stringify the parsed body as a best-effort if raw body isn't available.
    const digest = 'sha256=' + hmac.update(JSON.stringify(body)).digest('hex');

    if (signature !== digest) {
      throw new UnauthorizedException('Invalid signature');
    }

    if (body.action === 'published' && body.release) {
      const version = body.release.tag_name;
      const releaseNotes = body.release.body || 'تحديث جديد متاح.';
      let directApkUrl: string | undefined;

      if (body.release.assets && Array.isArray(body.release.assets)) {
        const apkAsset = body.release.assets.find((a: any) => a.name.endsWith('.apk'));
        if (apkAsset) {
          directApkUrl = apkAsset.browser_download_url;
        }
      }

      await this.updatesService.sendReleaseNotification(
        version,
        releaseNotes,
        directApkUrl
      );
    }

    return { success: true };
  }
}
