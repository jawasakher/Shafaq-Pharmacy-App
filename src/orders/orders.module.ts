import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

@Module({
    imports: [PrismaModule, IdentityModule],
    controllers: [OrdersController],
    providers: [OrdersService],
})
export class OrdersModule {}
