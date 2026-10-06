import {
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
import { RolesGuard } from '../identity/roles.guard.js';
import { Roles } from '../identity/roles.decorator.js';
import { OrdersService } from './orders.service.js';

type AuthenticatedRequest = Request & {
    user: {
        id: string;
        role: string;
    };
};

@Controller('api/v1/pharmacy/assignments')
export class PharmacyAssignmentsController {
    constructor(
        private readonly ordersService: OrdersService,
    ) {}

    @Get('offers')
    @HttpCode(HttpStatus.OK)
    @UseGuards(InternalIdentityGuard, RolesGuard)
    @Roles('OWNER', 'PHARMACIST')
    async listOffers(
        @Req() request: AuthenticatedRequest,
    ) {
        return {
            success: true,
            data: {
                items:
                    await this.ordersService.listPharmacyAssignmentOffers(
                        request.user.id,
                    ),
            },
        };
    }

    @Post(':assignmentId/accept')
    @HttpCode(HttpStatus.OK)
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
                this.requestId(request),
            ),
        };
    }
    @Post(':assignmentId/reject')
    @HttpCode(HttpStatus.OK)
    @UseGuards(InternalIdentityGuard, RolesGuard)
    @Roles('OWNER', 'PHARMACIST')
    async rejectAssignment(
        @Req() request: AuthenticatedRequest,
        @Param('assignmentId') assignmentId: string,
    ) {
        return {
            success: true,
            data: await this.ordersService.rejectPharmacyAssignment(
                assignmentId,
                request.user.id,
                this.requestId(request),
            ),
        };
    }

    private requestId(request: AuthenticatedRequest) {
        const value = request.headers['x-request-id'];
        return Array.isArray(value) ? value[0] : value;
    }
}

