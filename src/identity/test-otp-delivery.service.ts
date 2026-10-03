import { Injectable } from '@nestjs/common';

import { type OtpDeliveryPort } from './otp-delivery.port.js';

@Injectable()
export class TestOtpDeliveryService implements OtpDeliveryPort {
  private readonly codes = new Map<string, string>();

  async sendOtp(phone: string, code: string): Promise<void> {
    this.codes.set(phone, code);
  }

  getCode(phone: string): string | undefined {
    return this.codes.get(phone);
  }

  clear(): void {
    this.codes.clear();
  }
}
