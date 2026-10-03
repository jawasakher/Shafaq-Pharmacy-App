import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthRateLimitService } from './auth-rate-limit.service.js';
import { AuthSessionService } from './auth-session.service.js';
import { IdentityController } from './identity.controller.js';
import { IdentityGuard } from './identity.guard.js';
import { InternalIdentityGuard } from './internal-identity.guard.js';
import { RolesGuard } from './roles.guard.js';
import { NoopOtpDeliveryService } from './noop-otp-delivery.service.js';
import { OtpService } from './otp.service.js';
import { OTP_DELIVERY } from './otp-delivery.port.js';
import { PhoneNormalizerService } from './phone-normalizer.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [IdentityController],
  providers: [
    AuthRateLimitService,
    AuthSessionService,
    IdentityGuard,
    InternalIdentityGuard,
    RolesGuard,
    OtpService,
    PhoneNormalizerService,
    NoopOtpDeliveryService,
    {
      provide: OTP_DELIVERY,
      useExisting: NoopOtpDeliveryService,
    },
  ],
  exports: [AuthSessionService, IdentityGuard, InternalIdentityGuard, RolesGuard],
})
export class IdentityModule {}
