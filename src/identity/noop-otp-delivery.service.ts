import { Injectable } from '@nestjs/common';

import { OtpDeliveryPort } from './otp-delivery.port.js';

@Injectable()
export class NoopOtpDeliveryService implements OtpDeliveryPort {
  async sendOtp(_phone: string, _code: string): Promise<void> {
    // Intentionally empty until an approved OTP provider is selected.
    // OTP values must never be logged or returned by the API.
  }
}
