import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PrescriptionController } from './prescription.controller.js';
import { PrescriptionService } from './prescription.service.js';
import { PRIVATE_STORAGE } from './storage/private-storage.port.js';
import { PrivateDiskStorageService } from './storage/private-disk-storage.service.js';

@Module({
    imports: [PrismaModule, IdentityModule],
    controllers: [PrescriptionController],
    providers: [
        PrescriptionService,
        PrivateDiskStorageService,
        {
            provide: PRIVATE_STORAGE,
            useExisting: PrivateDiskStorageService,
        },
    ],
    exports: [PrescriptionService],
})
export class PrescriptionModule {}
