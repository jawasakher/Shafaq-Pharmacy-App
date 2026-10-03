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

    const latest = await this.prisma.otpChallenge.findFirst({
      where: {
        phoneHash,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (latest) {
      throw new ConflictException('A valid OTP already exists');
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');

    await this.prisma.otpChallenge.create({
      data: {
        phoneHash,
        codeHash: this.hash(code),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    await this.delivery.sendOtp(normalizedPhone, code);

    return { accepted: true };
  }

  async verifyOtp(phone: string, code: string) {
    const normalizedPhone = this.phoneNormalizer.normalize(phone);
    const phoneHash = this.hash(normalizedPhone);

    const challenge = await this.prisma.otpChallenge.findFirst({
      where: {
        phoneHash,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!challenge) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    if (challenge.attempts >= MAX_ATTEMPTS) {
      throw new TooManyRequestsException('Too many OTP attempts');
    }

    const codeHash = this.hash(code);

    if (codeHash !== challenge.codeHash) {
      await this.prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });

      throw new UnauthorizedException('Invalid or expired OTP');
    }

    await this.prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    });

    return normalizedPhone;
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
