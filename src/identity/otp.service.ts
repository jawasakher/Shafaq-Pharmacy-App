import {
  ConflictException,
  Inject,
  Injectable,
  TooManyRequestsException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomInt } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service.js';
import { OtpDeliveryPort, OTP_DELIVERY } from './otp-delivery.port.js';
import { PhoneNormalizerService } from './phone-normalizer.service.js';

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly phoneNormalizer: PhoneNormalizerService,
    @Inject(OTP_DELIVERY)
    private readonly delivery: OtpDeliveryPort,
  ) {}

  async requestOtp(phone: string) {
    const normalizedPhone = this.phoneNormalizer.normalize(phone);
    const phoneHash = this.hash(normalizedPhone);

    const existing = await this.prisma.otpChallenge.findFirst({
      where: {
        activeKey: phoneHash,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existing) {
      throw new ConflictException('A valid OTP already exists');
    }

    await this.prisma.otpChallenge.updateMany({
      where: {
        activeKey: phoneHash,
        OR: [
          { expiresAt: { lte: new Date() } },
          { consumedAt: { not: null } },
        ],
      },
      data: { activeKey: null },
    });

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');

    try {
      await this.prisma.otpChallenge.create({
        data: {
          phoneHash,
          activeKey: phoneHash,
          codeHash: this.hash(code),
          expiresAt: new Date(Date.now() + OTP_TTL_MS),
        },
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('A valid OTP already exists');
      }
      throw error;
    }

    await this.delivery.sendOtp(normalizedPhone, code);

    return { accepted: true };
  }

  async verifyOtp(phone: string, code: string) {
    const normalizedPhone = this.phoneNormalizer.normalize(phone);
    const phoneHash = this.hash(normalizedPhone);

    const challenge = await this.prisma.otpChallenge.findFirst({
      where: {
        activeKey: phoneHash,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!challenge) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    if (challenge.attempts >= MAX_ATTEMPTS) {
      throw new TooManyRequestsException('Too many OTP attempts');
    }

    const codeHash = this.hash(code);

    if (codeHash !== challenge.codeHash) {
      const result = await this.prisma.otpChallenge.updateMany({
        where: {
          id: challenge.id,
          consumedAt: null,
          attempts: { lt: MAX_ATTEMPTS },
        },
        data: { attempts: { increment: 1 } },
      });

      if (result.count === 0) {
        throw new TooManyRequestsException('Too many OTP attempts');
      }

      throw new UnauthorizedException('Invalid or expired OTP');
    }

    const consumed = await this.prisma.otpChallenge.updateMany({
      where: {
        id: challenge.id,
        activeKey: phoneHash,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: {
        consumedAt: new Date(),
        activeKey: null,
      },
    });

    if (consumed.count !== 1) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    return normalizedPhone;
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
