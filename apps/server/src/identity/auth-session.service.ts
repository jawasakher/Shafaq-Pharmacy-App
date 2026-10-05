import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AuthSessionService {
  constructor(private readonly prisma: PrismaService) {}

  async createCustomerSession(userId: string) {
    return this.createSession(userId, 'CUSTOMER', 30 * 24 * 60 * 60 * 1000);
  }

  async createInternalSession(userId: string) {
    return this.createSession(userId, 'INTERNAL', 8 * 60 * 60 * 1000);
  }

  private async createSession(
    userId: string,
    type: 'CUSTOMER' | 'INTERNAL',
    lifetimeMs: number,
  ) {
    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = this.hash(rawToken);

    const session = await this.prisma.authSession.create({
      data: {
        userId,
        type,
        tokenHash,
        expiresAt: new Date(Date.now() + lifetimeMs),
      },
    });

    return {
      sessionId: session.id,
      token: rawToken,
      expiresAt: session.expiresAt,
    };
  }

  async authenticate(token: string, expectedType?: 'CUSTOMER' | 'INTERNAL') {
    const tokenHash = this.hash(token);

    const session = await this.prisma.authSession.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !session ||
      (expectedType && session.type !== expectedType) ||
      session.revokedAt ||
      session.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    return session.user;
  }

  async revoke(token: string) {
    const tokenHash = this.hash(token);

    await this.prisma.authSession.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
