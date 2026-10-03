import { Module } from '@nestjs/common';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { IdentityModule } from './identity/identity.module.js';
import { PharmacyModule } from './pharmacy/pharmacy.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [PrismaModule, IdentityModule, PharmacyModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
