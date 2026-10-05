
import {
    Body,
    Delete,
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
import type { PharmacyMemberInput } from './pharmacy.service.js';

@Controller('api/v1/pharmacies')
export class PharmacyController {
    constructor(
        private readonly pharmacyService: PharmacyService,
    ) {}

    @Get()
    async findAll() {
        return this.pharmacyService.findAll();
    }

    @UseGuards(InternalIdentityGuard, RolesGuard)
    @Roles('OWNER', 'ADMIN')
    @Get(':pharmacyId/pharmacists')
    async listPharmacists(
        @Req() request: { params: { pharmacyId: string }; user: { id: string; role: string } },
    ) {
        return {
            success: true,
            data: await this.pharmacyService.listPharmacists(
                request.params.pharmacyId,
                request.user.id,
                request.user.role,
            ),
        };
    }

    @UseGuards(InternalIdentityGuard, RolesGuard)
    @Roles('OWNER', 'ADMIN')
    @Post(':pharmacyId/pharmacists')
    async addPharmacist(
        @Req() request: { params: { pharmacyId: string }; user: { id: string; role: string } },
        @Body() body: PharmacyMemberInput,
    ) {
        return {
            success: true,
            data: await this.pharmacyService.addPharmacist(
                request.params.pharmacyId,
                body.userId,
                request.user.id,
                request.user.role,
            ),
        };
    }

    @UseGuards(InternalIdentityGuard, RolesGuard)
    @Roles('OWNER', 'ADMIN')
    @Delete(':pharmacyId/pharmacists/:userId')
    async removePharmacist(
        @Req() request: { params: { pharmacyId: string; userId: string }; user: { id: string; role: string } },
    ) {
        return {
            success: true,
            data: await this.pharmacyService.removePharmacist(
                request.params.pharmacyId,
                request.params.userId,
                request.user.id,
                request.user.role,
            ),
        };
    }

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
        @Req() request: { params: { pharmacyId: string } },
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
        @Req() request: { params: { pharmacyId: string } },
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
        @Req() request: { params: { pharmacyId: string } },
    ) {
        return {
            success: true,
            data: await this.pharmacyService.suspendPharmacy(
                request.params.pharmacyId,
            ),
        };
    }

    // OWNER: فتح الصيدلية
    @UseGuards(InternalIdentityGuard, RolesGuard)
    @Roles('OWNER')
    @Post(':pharmacyId/open')
    async openPharmacy(
        @Req() request: { params: { pharmacyId: string }; user: { id: string } },
    ) {
        return {
            success: true,
            data: await this.pharmacyService.openPharmacy(
                request.params.pharmacyId,
                request.user.id,
                'OWNER',
            ),
        };
    }

    // OWNER: إغلاق الصيدلية
    @UseGuards(InternalIdentityGuard, RolesGuard)
    @Roles('OWNER')
    @Post(':pharmacyId/close')
    async closePharmacy(
        @Req() request: { params: { pharmacyId: string }; user: { id: string } },
    ) {
        return {
            success: true,
            data: await this.pharmacyService.closePharmacy(
                request.params.pharmacyId,
                request.user.id,
                'OWNER',
            ),
        };
    }

    // ADMIN: فتح أي صيدلية
    @UseGuards(InternalIdentityGuard, RolesGuard)
    @Roles('ADMIN')
    @Post('admin/:pharmacyId/open')
    async adminOpenPharmacy(
        @Req() request: { params: { pharmacyId: string }; user: { id: string } },
    ) {
        return {
            success: true,
            data: await this.pharmacyService.openPharmacy(
                request.params.pharmacyId,
                request.user.id,
                'ADMIN',
            ),
        };
    }

    // ADMIN: إغلاق أي صيدلية
    @UseGuards(InternalIdentityGuard, RolesGuard)
    @Roles('ADMIN')
    @Post('admin/:pharmacyId/close')
    async adminClosePharmacy(
        @Req() request: { params: { pharmacyId: string }; user: { id: string } },
    ) {
        return {
            success: true,
            data: await this.pharmacyService.closePharmacy(
                request.params.pharmacyId,
                request.user.id,
                'ADMIN',
            ),
        };
    }

    @UseGuards(IdentityGuard)
    @Post('applications')
    async submitApplication(
        @Req() request: { user: { id: string } },
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
