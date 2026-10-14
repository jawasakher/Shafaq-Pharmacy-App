import { Module } from '@nestjs/common';

import { AdminModule } from './admin/admin.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConsultationModule } from './consultation/consultation.module.js';
import { DeliveryModule } from './delivery/delivery.module.js';
import { IdentityModule } from './identity/identity.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { PharmacyModule } from './pharmacy/pharmacy.module.js';
import { PrescriptionModule } from './prescription/prescription.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UpdatesModule } from './updates/updates.module.js';
import { PaymentsModule } from './payments/payments.module.js';

@Module({
  imports: [
    PrismaModule,
    IdentityModule,
    PharmacyModule,
    OrdersModule,
    PrescriptionModule,
    DeliveryModule,
    ConsultationModule,
    AdminModule,
    UpdatesModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}