import {
    Body,
    Controller,
    Get,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';

import { IdentityGuard } from '../identity/identity.guard.js';
import {
    PharmacyApplicationInput,
    PharmacyService,
} from './pharmacy.service.js';

@Controller('api/v1/pharmacies')
export class PharmacyController {
    constructor(private readonly pharmacyService: PharmacyService) {}

    @Get()
    async findAll() {
        return this.pharmacyService.findAll();
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
