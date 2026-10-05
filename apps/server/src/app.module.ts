import { Module } from '@nestjs/common';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { IdentityModule } from './identity/identity.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { PharmacyModule } from './pharmacy/pharmacy.module.js';
import { PrescriptionModule } from './prescription/prescription.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    PrismaModule,
    IdentityModule,
    PharmacyModule,
    OrdersModule,
    PrescriptionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}