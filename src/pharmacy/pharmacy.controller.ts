import {
    Body,
    Controller,
    Get,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';

import { IdentityGuard } from '../identity/identity.guard.js';
import { InternalIdentityGuard } from '../identity/internal-identity.guard.js';
import { Roles } from '../identity/roles.decorator.js';
import { RolesGuard } from '../identity/roles.guard.js';

import { PharmacyService } from './pharmacy.service.js';
import type { PharmacyApplicationInput } from './pharmacy.service.js';

@Controller('api/v1/pharmacies')
export class PharmacyController {
    constructor(
        private readonly pharmacyService: PharmacyService,
    ) {}

    // ============================================================
    // PUBLIC PHARMACY DISCOVERY
    // ============================================================

    @Get()
    async findAll() {
        return this.pharmacyService.findAll();
    }

    // ============================================================
    // ADMIN — PHARMACY APPROVAL
    // ============================================================

    @UseGuards(InternalIdentityGuard, RolesGuard)
    @Roles('ADMIN')
    @Get('admin/applications')
    async listApplications() {
        return {
            success: true,
            data: await this.pharmacyService.listApplications(),
        };
    }

    @UseGuards(InternalIdentityGuard, RolesGuard)
    @Roles('ADMIN')
    @Post('admin/:pharmacyId/approve')
    async approveApplication(
        @Req()
        request: {
            params: {
                pharmacyId: string;
            };
        },
    ) {
        return {
            success: true,
            data: await this.pharmacyService.approveApplication(
                request.params.pharmacyId,
            ),
        };
    }

    @UseGuards(InternalIdentityGuard, RolesGuard)
    @Roles('ADMIN')
    @Post('admin/:pharmacyId/reject')
    async rejectApplication(
        @Req()
        request: {
            params: {
                pharmacyId: string;
            };
        },
    ) {
        return {
            success: true,
            data: await this.pharmacyService.rejectApplication(
                request.params.pharmacyId,
            ),
        };
    }

    @UseGuards(InternalIdentityGuard, RolesGuard)
    @Roles('ADMIN')
    @Post('admin/:pharmacyId/suspend')
    async suspendPharmacy(
        @Req()
        request: {
            params: {
                pharmacyId: string;
            };
        },
    ) {
        return {
            success: true,
            data: await this.pharmacyService.suspendPharmacy(
                request.params.pharmacyId,
            ),
        };
    }

    // ============================================================
    // PHARMACY APPLICATION
    // ============================================================

    @UseGuards(IdentityGuard)
    @Post('applications')
    async submitApplication(
        @Req()
        request: {
            user: {
                id: string;
            };
        },
        @Body() body: PharmacyApplicationInput,
    ) {
        return {
            success: true,
            data: await this.pharmacyService.submitApplication(
                request.user.id,
                body,
            ),
        };
    }
}