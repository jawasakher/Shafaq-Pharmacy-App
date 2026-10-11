import { Injectable } from '@nestjs/common';

import { type OtpDeliveryPort } from './otp-delivery.port.js';

@Injectable()
export class TestOtpDeliveryService implements OtpDeliveryPort {
  private readonly codes = new Map<string, string>();

  async sendOtp(target: string, code: string, contextName?: string): Promise<void> {
    this.codes.set(target, code);
  }

  getCode(target: string): string | undefined {
    return this.codes.get(target);
  }

  clear(): void {
    this.codes.clear();
  }
}
