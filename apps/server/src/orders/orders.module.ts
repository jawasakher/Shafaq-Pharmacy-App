import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PharmacyAssignmentsController } from './pharmacy-assignments.controller.js';
import { DeliveryPricingService } from './delivery-pricing.service.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

@Module({
    imports: [PrismaModule, IdentityModule],
    controllers: [
        OrdersController,
        PharmacyAssignmentsController,
    ],
    providers: [
        OrdersService,
        DeliveryPricingService,
    ],
})
export class OrdersModule {}
