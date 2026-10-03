import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module.js';
import { PharmacyController } from './pharmacy.controller.js';
import { PharmacyService } from './pharmacy.service.js';

@Module({
    imports: [IdentityModule],
    controllers: [PharmacyController],
    providers: [PharmacyService],
})
export class PharmacyModule {}
