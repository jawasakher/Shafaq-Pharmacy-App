import { Injectable } from '@nestjs/common';

import { OtpDeliveryPort } from './otp-delivery.port.js';

@Injectable()
export class NoopOtpDeliveryService implements OtpDeliveryPort {
  async sendOtp(_target: string, _code: string, _contextName?: string): Promise<void> {
    // Intentionally empty until an approved OTP provider is selected.
    // OTP values must never be logged or returned by the API.
  }
}
