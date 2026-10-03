import { Controller, Get } from '@nestjs/common';

import { PharmacyService } from './pharmacy.service.js';

@Controller('api/v1/pharmacies')
export class PharmacyController {
    constructor(private readonly pharmacyService: PharmacyService) {}

    @Get()
    async findAll() {
        return this.pharmacyService.findAll();
    }
}