import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
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
import { PharmacyQuoteDto } from './dto/pharmacy-quote.dto.js';
import { TransferOrderDto } from './dto/transfer-order.dto.js';
import { PriceResponseDto } from './dto/price-response.dto.js';
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

    @Post(':orderId/price-response')
    @HttpCode(HttpStatus.OK)
    @UseGuards(CustomerIdentityGuard, RolesGuard)
    @Roles('CUSTOMER')
    async priceResponse(
        @Req() request: AuthenticatedRequest,
        @Param('orderId') orderId: string,
        @Body() dto: PriceResponseDto,
    ) {
        return this.ordersService.respondToPrice(
            orderId,
            request.user.id,
            dto.decision,
        );
    }

    @Post(':orderId/transfer')
    @UseGuards(InternalIdentityGuard, RolesGuard)
    @Roles('OWNER', 'PHARMACIST')
    async transferOrder(
        @Req() request: AuthenticatedRequest,
        @Param('orderId') orderId: string,
        @Body() _dto: TransferOrderDto,
        @Req() request: AuthenticatedRequest,
    ) {
        return this.ordersService.requestOrderTransfer(
            orderId,
            request.user.id,
            this.requestId(request),
        );
    }

    @Post(':orderId/review')
    @HttpCode(HttpStatus.OK)
    @UseGuards(InternalIdentityGuard, RolesGuard)
    @Roles('OWNER', 'PHARMACIST')
    async startReview(
        @Req() request: AuthenticatedRequest,
        @Param('orderId') orderId: string,
    ) {
        return this.ordersService.startPharmacyReview(
            orderId,
            request.user.id,
        );
    }

    @Post(':orderId/quote')
    @HttpCode(HttpStatus.OK)
    @UseGuards(InternalIdentityGuard, RolesGuard)
    @Roles('OWNER', 'PHARMACIST')
    async quoteOrder(
        @Req() request: AuthenticatedRequest,
        @Param('orderId') orderId: string,
        @Body() dto: PharmacyQuoteDto,
    ) {
        return this.ordersService.quotePharmacyOrder(
            orderId,
            request.user.id,
            dto,
        );
    }

    private requestId(request: AuthenticatedRequest) {
        const value = request.headers['x-request-id'];
        return Array.isArray(value) ? value[0] : value;
    }
}
