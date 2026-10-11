import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ConsultationController } from './consultation.controller.js';
import { ConsultationService } from './consultation.service.js';

@Module({
  imports: [PrismaModule, IdentityModule],
  controllers: [ConsultationController],
  providers: [ConsultationService],
  exports: [ConsultationService],
})
export class ConsultationModule {}
