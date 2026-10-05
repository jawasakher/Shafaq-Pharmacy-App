import {
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

type Bucket = {
  count: number;
  resetAt: number;
};

const REQUEST_WINDOW_MS = 15 * 60 * 1000;
const PHONE_REQUEST_LIMIT = 3;
const IP_REQUEST_LIMIT = 10;
const DEVICE_REQUEST_LIMIT = 5;

@Injectable()
export class AuthRateLimitService {
  private readonly buckets = new Map<string, Bucket>();

  consumeOtpRequest(phone: string, ip: string, deviceId?: string) {
    this.consume('phone', phone, PHONE_REQUEST_LIMIT);
    this.consume('ip', ip || 'unknown', IP_REQUEST_LIMIT);

    if (deviceId) {
      this.consume('device', deviceId, DEVICE_REQUEST_LIMIT);
    }
  }

  reset() {
    this.buckets.clear();
  }

  private consume(scope: string, value: string, limit: number) {
    const key = `${scope}:${value}`;
    const now = Date.now();
    const current = this.buckets.get(key);

    if (!current || current.resetAt <= now) {
      this.buckets.set(key, {
        count: 1,
        resetAt: now + REQUEST_WINDOW_MS,
      });
      return;
    }

    if (current.count >= limit) {
      throw new HttpException(
        'Too many OTP requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    current.count += 1;
  }
}
