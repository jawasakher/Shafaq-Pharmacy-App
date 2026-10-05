import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module.js';
import { PrescriptionController } from './prescription.controller.js';
import { PrescriptionService } from './prescription.service.js';

@Module({
    imports: [PrismaModule],
    controllers: [PrescriptionController],
    providers: [PrescriptionService],
    exports: [PrescriptionService],
})
export class PrescriptionModule {}