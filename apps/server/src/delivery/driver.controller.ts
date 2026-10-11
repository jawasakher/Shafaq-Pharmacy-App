import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { InternalIdentityGuard } from '../identity/internal-identity.guard.js';
import { Roles } from '../identity/roles.decorator.js';
import { RolesGuard } from '../identity/roles.guard.js';
import { DeliveryService } from './delivery.service.js';
import { UpdateLocationDto } from './dto/update-location.dto.js';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
    role: string;
  };
};

@Controller('api/v1/driver')
@UseGuards(InternalIdentityGuard, RolesGuard)
@Roles('DRIVER')
export class DriverController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post('location')
  @HttpCode(HttpStatus.OK)
  async updateLocation(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateLocationDto,
  ) {
    return {
      success: true,
      data: await this.deliveryService.updateDriverLocation(
        request.user.id,
        dto,
      ),
    };
  }

  @Post('availability')
  @HttpCode(HttpStatus.OK)
  async toggleAvailability(
    @Req() request: AuthenticatedRequest,
    @Body() body: { availability: 'OFFLINE' | 'AVAILABLE' | 'BUSY' },
  ) {
    return {
      success: true,
      data: await this.deliveryService.toggleAvailability(
        request.user.id,
        body.availability,
      ),
    };
  }

  @Get('offers')
  async listOffers(@Req() request: AuthenticatedRequest) {
    return {
      success: true,
      data: await this.deliveryService.listDeliveryOffers(request.user.id),
    };
  }

  @Post('offers/:id/accept')
  @HttpCode(HttpStatus.OK)
  async acceptOffer(
    @Req() request: AuthenticatedRequest,
    @Param('id') offerId: string,
  ) {
    return {
      success: true,
      data: await this.deliveryService.acceptDeliveryOffer(
        request.user.id,
        offerId,
      ),
    };
  }

  @Post('deliveries/:id/pickup')
  @HttpCode(HttpStatus.OK)
  async pickupDelivery(
    @Req() request: AuthenticatedRequest,
    @Param('id') deliveryId: string,
  ) {
    return {
      success: true,
      data: await this.deliveryService.pickupDelivery(
        request.user.id,
        deliveryId,
      ),
    };
  }

  @Post('deliveries/:id/complete')
  @HttpCode(HttpStatus.OK)
  async completeDelivery(
    @Req() request: AuthenticatedRequest,
    @Param('id') deliveryId: string,
  ) {
    return {
      success: true,
      data: await this.deliveryService.completeDelivery(
        request.user.id,
        deliveryId,
      ),
    };
  }
}
