import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service.js';

type DevSession = {
  id: string;
  userId: string;
  type: 'CUSTOMER' | 'INTERNAL' | 'PRE_MFA';
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  user: {
    id: string;
    phone: string;
    name: string | null;
    role: string;
  };
};

@Injectable()
export class AuthSessionService {
  private readonly logger = new Logger(AuthSessionService.name);
  private readonly devSessions = new Map<string, DevSession>();

  constructor(private readonly prisma: PrismaService) {}

  async createCustomerSession(userId: string, userPhone?: string, userName?: string) {
    return this.createSession(userId, 'CUSTOMER', 30 * 24 * 60 * 60 * 1000, userPhone, userName, 'CUSTOMER');
  }

  async createInternalSession(userId: string, userPhone?: string, userName?: string, role: string = 'PHARMACIST') {
    return this.createSession(userId, 'INTERNAL', 8 * 60 * 60 * 1000, userPhone, userName, role);
  }

  async createPreMfaSession(userId: string, userPhone?: string, userName?: string) {
    return this.createSession(userId, 'PRE_MFA', 10 * 60 * 1000, userPhone, userName, 'ADMIN');
  }

  private async createSession(
    userId: string,
    type: 'CUSTOMER' | 'INTERNAL' | 'PRE_MFA',
    lifetimeMs: number,
    userPhone?: string,
    userName?: string,
    role: string = 'CUSTOMER',
  ) {
    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = this.hash(rawToken);
    const expiresAt = new Date(Date.now() + lifetimeMs);

    try {
      const session = await this.prisma.authSession.create({
        data: {
          userId,
          type,
          tokenHash,
          expiresAt,
        },
      });

      return {
        sessionId: session.id,
        token: rawToken,
        expiresAt: session.expiresAt,
      };
    } catch (dbError: any) {
      this.logger.warn(`Database session creation failed (${dbError?.message || dbError}). Falling back to in-memory session.`);

      const devSessionId = `dev-session-${Date.now()}-${randomBytes(4).toString('hex')}`;
      const devSession: DevSession = {
        id: devSessionId,
        userId,
        type,
        tokenHash,
        expiresAt,
        revokedAt: null,
        user: {
          id: userId,
          phone: userPhone || '+963991000000',
          name: userName || 'مستخدم شفق',
          role,
        },
      };

      this.devSessions.set(tokenHash, devSession);

      return {
        sessionId: devSessionId,
        token: rawToken,
        expiresAt,
      };
    }
  }

  async authenticate(token: string, expectedType?: 'CUSTOMER' | 'INTERNAL' | 'PRE_MFA') {
    const tokenHash = this.hash(token);

    try {
      const session = await this.prisma.authSession.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

      if (session) {
        if (
          (expectedType && session.type !== expectedType) ||
          (!expectedType && session.type === 'PRE_MFA') ||
          session.revokedAt ||
          session.expiresAt <= new Date()
        ) {
          throw new UnauthorizedException('Invalid or expired session');
        }
        return session.user;
      }
    } catch (dbError) {
      if (dbError instanceof UnauthorizedException) {
        throw dbError;
      }
      this.logger.warn('Database auth failed, checking in-memory session cache.');
    }

    const devSession = this.devSessions.get(tokenHash);

    if (
      !devSession ||
      (expectedType && devSession.type !== expectedType) ||
      (!expectedType && devSession.type === 'PRE_MFA') ||
      devSession.revokedAt ||
      devSession.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    return devSession.user;
  }

  async revoke(token: string) {
    const tokenHash = this.hash(token);

    try {
      await this.prisma.authSession.updateMany({
        where: {
          tokenHash,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    } catch {
      // Ignore DB error
    }

    const devSession = this.devSessions.get(tokenHash);
    if (devSession) {
      devSession.revokedAt = new Date();
    }
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
