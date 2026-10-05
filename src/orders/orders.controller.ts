import {
    Body,
    Controller,
    Param,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { CustomerIdentityGuard } from '../identity/customer-identity.guard.js';
import { InternalIdentityGuard } from '../identity/internal-identity.guard.js';
import { RolesGuard } from '../identity/roles.guard.js';
import { Roles } from '../identity/roles.decorator.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { OrdersService } from './orders.service.js';

type AuthenticatedRequest = Request & {
    user: {
        id: string;
        role: string;
    };
};

@Controller('api/v1/orders')
export class OrdersController {
    constructor(
        private readonly ordersService: OrdersService,
    ) {}

    @Post()
    @UseGuards(CustomerIdentityGuard, RolesGuard)
    @Roles('CUSTOMER')
    async createOrder(
        @Req() request: AuthenticatedRequest,
        @Body() dto: CreateOrderDto,
    ) {
        return this.ordersService.createOrder(
            request.user.id,
            dto,
        );
    }

    @Post('pharmacy-assignments/:assignmentId/accept')
    @UseGuards(InternalIdentityGuard, RolesGuard)
    @Roles('OWNER', 'PHARMACIST')
    async acceptAssignment(
        @Req() request: AuthenticatedRequest,
        @Param('assignmentId') assignmentId: string,
    ) {
        return {
            success: true,
            data: await this.ordersService.acceptPharmacyAssignment(
                assignmentId,
                request.user.id,
            ),
        };
    }
}
