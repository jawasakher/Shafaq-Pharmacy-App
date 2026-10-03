import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthSessionService } from './auth-session.service.js';
import { IdentityGuard } from './identity.guard.js';
import { OtpService } from './otp.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('api/v1')
export class IdentityController {
  constructor(
    private readonly otp: OtpService,
    private readonly sessions: AuthSessionService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('auth/otp/request')
  async requestOtp(@Body() body: { phone: string }) {
    return {
      success: true,
      data: await this.otp.requestOtp(body.phone),
    };
  }

  @Post('auth/otp/verify')
  async verifyOtp(@Body() body: { phone: string; code: string }) {
    const phone = await this.otp.verifyOtp(body.phone, body.code);

    const user = await this.prisma.user.upsert({
      where: { phone },
      update: {},
      create: {
        phone,
        role: 'CUSTOMER',
      },
    });

    const session = await this.sessions.createCustomerSession(user.id);

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          role: user.role,
        },
        session,
      },
    };
  }

  @UseGuards(IdentityGuard)
  @Get('me')
  async me(@Req() request: { user: { id: string } }) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: request.user.id },
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
      },
    });

    return {
      success: true,
      data: user,
    };
  }

  @UseGuards(IdentityGuard)
  @Post('auth/logout')
  async logout(@Headers('authorization') authorization?: string) {
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length).trim()
      : '';

    if (token) {
      await this.sessions.revoke(token);
    }

    return {
      success: true,
      data: null,
    };
  }
}
