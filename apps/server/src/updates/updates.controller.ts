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
} from '@nestjs/common';
import type { Request } from 'express';

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
}
