import { describe, it, expect, beforeEach } from 'vitest';
import { AuthRateLimitService } from './auth-rate-limit.service.js';
import { HttpException } from '@nestjs/common';

describe('AuthRateLimitService', () => {
  let service: AuthRateLimitService;

  beforeEach(() => {
    service = new AuthRateLimitService();
  });

  it('allows requests within phone limit (3) and rejects on 4th', () => {
    service.consumeOtpRequest('+963991111111', '127.0.0.1', 'device-1');
    service.consumeOtpRequest('+963991111111', '127.0.0.2', 'device-2');
    service.consumeOtpRequest('+963991111111', '127.0.0.3', 'device-3');

    expect(() =>
      service.consumeOtpRequest('+963991111111', '127.0.0.4', 'device-4'),
    ).toThrow(HttpException);
  });

  it('enforces IP limit (10) independently', () => {
    for (let i = 1; i <= 10; i++) {
      service.consumeOtpRequest(`+96399100000${i}`, '192.168.1.1', `device-${i}`);
    }

    expect(() =>
      service.consumeOtpRequest('+963991999999', '192.168.1.1', 'device-new'),
    ).toThrow(HttpException);
  });

  it('enforces Device limit (5) independently', () => {
    for (let i = 1; i <= 5; i++) {
      service.consumeOtpRequest(`+96399100000${i}`, `10.0.0.${i}`, 'shared-device-1');
    }

    expect(() =>
      service.consumeOtpRequest('+963991999999', '10.0.0.99', 'shared-device-1'),
    ).toThrow(HttpException);
  });

  it('allows resetting rate limit buckets', () => {
    service.consumeOtpRequest('+963991111111', '127.0.0.1', 'device-1');
    service.consumeOtpRequest('+963991111111', '127.0.0.2', 'device-2');
    service.consumeOtpRequest('+963991111111', '127.0.0.3', 'device-3');

    service.reset();

    expect(() =>
      service.consumeOtpRequest('+963991111111', '127.0.0.1', 'device-1'),
    ).not.toThrow();
  });
});
