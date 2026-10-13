import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { AuthRateLimitService } from './auth-rate-limit.service.js';
import { AuthSessionService } from './auth-session.service.js';
import { IdentityGuard } from './identity.guard.js';
import { MfaIdentityGuard } from './mfa-identity.guard.js';
import { OtpService } from './otp.service.js';
import { TotpService } from './totp.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('api/v1')
export class IdentityController {
  constructor(
    private readonly otp: OtpService,
    private readonly totp: TotpService,
    private readonly rateLimit: AuthRateLimitService,
    private readonly sessions: AuthSessionService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('auth/otp/request')
  async requestOtp(
    @Body() body: { phone: string; email?: string; username?: string; purpose?: string },
    @Req() request: { ip?: string; headers: Record<string, string | string[] | undefined> },
  ) {
    const deviceIdHeader = request.headers['x-device-id'];
    const deviceId = Array.isArray(deviceIdHeader) ? deviceIdHeader[0] : deviceIdHeader;

    const purpose = body.purpose || 'CUSTOMER';
    if (purpose !== 'CUSTOMER' && purpose !== 'INTERNAL') {
      throw new ForbiddenException('Invalid purpose specified');
    }

    this.rateLimit.consumeOtpRequest(body.phone, request.ip ?? '', deviceId);

    return {
      success: true,
      data: await this.otp.requestOtp(body.phone, purpose, body.email, body.username),
    };
  }

  @Post('auth/otp/verify')
  async verifyOtp(@Body() body: { phone: string; code: string; email?: string; username?: string; purpose?: string }) {
    const purpose = body.purpose || 'CUSTOMER';
    if (purpose !== 'CUSTOMER' && purpose !== 'INTERNAL') {
      throw new ForbiddenException('Invalid purpose specified');
    }

    const phone = await this.otp.verifyOtp(body.phone, body.code, purpose);

    let user: { id: string; phone: string; name: string | null; role: string };

    try {
      user = await this.prisma.user.upsert({
        where: { phone },
        update: {
          ...(body.username ? { name: body.username } : {}),
          ...(body.email ? { email: body.email } : {}),
        },
        create: {
          phone,
          name: body.username,
          email: body.email,
          role: 'CUSTOMER',
        },
      });
    } catch {
      // In-memory dev fallback user if DB connection is unavailable
      user = {
        id: `dev-user-${phone.replace(/\+/g, '')}`,
        phone,
        name: body.username || 'مستخدم شفق',
        role: purpose === 'INTERNAL' ? 'PHARMACIST' : 'CUSTOMER',
      };
    }

    let session;

    if (purpose === 'INTERNAL') {
      if (user.role === 'CUSTOMER') {
        throw new ForbiddenException('Insufficient permissions for internal access');
      }

      try {
        if (user.role === 'PHARMACIST' || user.role === 'OWNER') {
          const activeMembership = await this.prisma.pharmacyMember.findFirst({
            where: {
              userId: user.id,
              status: 'ACTIVE',
              pharmacy: { approvalStatus: 'APPROVED' },
            },
          });

          if (!activeMembership) {
            throw new ForbiddenException('No active membership in an approved pharmacy');
          }
        } else if (user.role === 'DRIVER') {
          const driver = await this.prisma.driver.findUnique({
            where: { userId: user.id },
          });

          if (!driver || driver.approvalStatus !== 'APPROVED') {
            throw new ForbiddenException('Driver account is not approved');
          }
        }
      } catch (dbErr) {
        if (dbErr instanceof ForbiddenException) throw dbErr;
        // Ignore DB connection errors in dev mode for testing internal access
      }

      if (user.role === 'ADMIN') {
        session = await this.sessions.createPreMfaSession(user.id, user.phone, user.name || undefined);
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
            requiresMfa: true,
            setupRequired: true,
          },
        };
      }

      session = await this.sessions.createInternalSession(user.id, user.phone, user.name || undefined, user.role);
    } else {
      session = await this.sessions.createCustomerSession(user.id, user.phone, user.name || undefined);
    }

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
        requiresMfa: false,
      },
    };
  }

  @UseGuards(MfaIdentityGuard)
  @Post('auth/mfa/setup')
  async setupMfa(@Req() request: { user: { id: string } }) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: request.user.id },
    });

    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('MFA setup is restricted to admin accounts');
    }

    if (user.mfaEnabled) {
      throw new ForbiddenException('MFA is already enabled on this account');
    }

    const plainSecret = this.totp.generateSecret();
    const encryptedSecret = this.totp.encryptSecret(plainSecret);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        mfaSecret: encryptedSecret,
        mfaEnabled: false,
      },
    });

    const otpauthUri = this.totp.getTotpUri(plainSecret, user.phone);

    return {
      success: true,
      data: {
        secret: plainSecret,
        otpauthUri,
      },
    };
  }

  @UseGuards(MfaIdentityGuard)
  @Post('auth/mfa/enable')
  async enableMfa(
    @Req() request: { user: { id: string } },
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { code: string },
  ) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: request.user.id },
    });

    if (user.mfaEnabled) {
      throw new ForbiddenException('MFA is already enabled on this account');
    }

    if (!user.mfaSecret) {
      throw new UnauthorizedException('MFA secret is not generated');
    }

    const plainSecret = this.totp.decryptSecret(user.mfaSecret);
    const isValid = this.totp.verifyTotp(plainSecret, body.code);

    if (!isValid) {
      throw new UnauthorizedException('Invalid MFA code');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { mfaEnabled: true },
    });

    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length).trim()
      : '';

    if (token) {
      await this.sessions.revoke(token);
    }

    const session = await this.sessions.createInternalSession(user.id);

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

  @UseGuards(MfaIdentityGuard)
  @Post('auth/mfa/verify')
  async verifyMfa(
    @Req() request: { user: { id: string } },
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { code: string },
  ) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: request.user.id },
    });

    if (!user.mfaSecret || !user.mfaEnabled) {
      throw new UnauthorizedException('MFA is not configured or enabled for this account');
    }

    const plainSecret = this.totp.decryptSecret(user.mfaSecret);
    const isValid = this.totp.verifyTotp(plainSecret, body.code);

    if (!isValid) {
      throw new UnauthorizedException('Invalid MFA code');
    }

    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length).trim()
      : '';

    if (token) {
      await this.sessions.revoke(token);
    }

    const session = await this.sessions.createInternalSession(user.id);

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
  async logout(@Req() request: { user: { id: string } }, @Headers('authorization') authorization?: string) {
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length).trim()
      : '';

    if (token) {
      await this.sessions.revoke(token);
      try {
        await this.prisma.deviceToken.deleteMany({
          where: { userId: request.user.id }
        });
      } catch {
        // Safe to ignore if no tokens
      }
    }

    return {
      success: true,
      data: null,
    };
  }
}
