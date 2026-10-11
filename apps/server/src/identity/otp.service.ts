import {
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomInt } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service.js';
import { type OtpDeliveryPort, OTP_DELIVERY } from './otp-delivery.port.js';
import { PhoneNormalizerService } from './phone-normalizer.service.js';

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const DB_TIMEOUT_MS = 500; // Ultra-fast 500ms DB query timeout

type DevOtpMemory = {
  phoneHash: string;
  codeHash: string;
  purpose: string;
  expiresAt: Date;
  attempts: number;
  consumed: boolean;
};

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly devMemoryMap = new Map<string, DevOtpMemory>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly phoneNormalizer: PhoneNormalizerService,
    @Inject(OTP_DELIVERY)
    private readonly delivery: OtpDeliveryPort,
  ) {}

  private withTimeout<T>(promise: Promise<T>, ms: number = DB_TIMEOUT_MS): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('DB Timeout')), ms);
      promise
        .then((res) => {
          clearTimeout(timer);
          resolve(res);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  async requestOtp(phone: string, purpose: string = 'CUSTOMER', email?: string, username?: string) {
    const normalizedPhone = this.phoneNormalizer.normalize(phone);
    const phoneHash = this.hash(normalizedPhone);
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');

    // Fast in-memory registration for immediate dev response
    this.devMemoryMap.set(phoneHash, {
      phoneHash,
      codeHash: this.hash(code),
      purpose,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
      attempts: 0,
      consumed: false,
    });

    try {
      const existing = await this.withTimeout(
        this.prisma.otpChallenge.findFirst({
          where: {
            activeKey: phoneHash,
            consumedAt: null,
            expiresAt: { gt: new Date() },
          },
        }),
      );

      if (existing) {
        throw new ConflictException('A valid OTP already exists');
      }

      await this.withTimeout(
        this.prisma.otpChallenge.updateMany({
          where: {
            activeKey: phoneHash,
            OR: [
              { expiresAt: { lte: new Date() } },
              { consumedAt: { not: null } },
            ],
          },
          data: { activeKey: null },
        }),
      );

      await this.withTimeout(
        this.prisma.otpChallenge.create({
          data: {
            phoneHash,
            purpose,
            activeKey: phoneHash,
            codeHash: this.hash(code),
            expiresAt: new Date(Date.now() + OTP_TTL_MS),
          },
        }),
      );
    } catch (dbError) {
      if (dbError instanceof ConflictException) {
        throw dbError;
      }
      this.logger.warn(`DB write bypassed or timed out (${(dbError as any)?.message || dbError}). Operating in fast in-memory mode.`);
    }

    const deliveryTarget = email || normalizedPhone;
    await this.delivery.sendOtp(deliveryTarget, code, username);

    return { accepted: true };
  }

  async verifyOtp(phone: string, code: string, purpose: string = 'CUSTOMER') {
    const normalizedPhone = this.phoneNormalizer.normalize(phone);
    const phoneHash = this.hash(normalizedPhone);

    // Fast Path 1: Check in-memory OTP cache first (Instant 0ms verification)
    const devChallenge = this.devMemoryMap.get(phoneHash);
    if (devChallenge) {
      if (devChallenge.consumed || devChallenge.expiresAt <= new Date() || devChallenge.purpose !== purpose) {
        throw new UnauthorizedException('Invalid or expired OTP');
      }

      if (devChallenge.attempts >= MAX_ATTEMPTS) {
        throw new HttpException('Too many OTP attempts', HttpStatus.TOO_MANY_REQUESTS);
      }

      if (this.hash(code) !== devChallenge.codeHash) {
        devChallenge.attempts += 1;
        throw new UnauthorizedException('Invalid or expired OTP');
      }

      devChallenge.consumed = true;
      return normalizedPhone;
    }

    // Fast Path 2: Check Prisma database
    try {
      const challenge = await this.withTimeout(
        this.prisma.otpChallenge.findFirst({
          where: {
            activeKey: phoneHash,
            consumedAt: null,
            expiresAt: { gt: new Date() },
          },
        }),
      );

      if (!challenge || challenge.purpose !== purpose) {
        throw new UnauthorizedException('Invalid or expired OTP');
      }

      if (challenge.attempts >= MAX_ATTEMPTS) {
        throw new HttpException(
          'Too many OTP attempts',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      const codeHash = this.hash(code);

      if (codeHash !== challenge.codeHash) {
        await this.withTimeout(
          this.prisma.otpChallenge.updateMany({
            where: {
              id: challenge.id,
              consumedAt: null,
              attempts: { lt: MAX_ATTEMPTS },
            },
            data: { attempts: { increment: 1 } },
          }),
        );

        throw new UnauthorizedException('Invalid or expired OTP');
      }

      const consumed = await this.withTimeout(
        this.prisma.otpChallenge.updateMany({
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
        }),
      );

      if (consumed.count !== 1) {
        throw new UnauthorizedException('Invalid or expired OTP');
      }

      return normalizedPhone;
    } catch (dbError) {
      if (dbError instanceof UnauthorizedException || dbError instanceof HttpException) {
        throw dbError;
      }
      throw new UnauthorizedException('Invalid or expired OTP');
    }
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
