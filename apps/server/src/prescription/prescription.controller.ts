import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Param,
    Post,
    Req,
    StreamableFile,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';

import { CustomerIdentityGuard } from '../identity/customer-identity.guard.js';
import { IdentityGuard } from '../identity/identity.guard.js';
import { InternalIdentityGuard } from '../identity/internal-identity.guard.js';
import { RolesGuard } from '../identity/roles.guard.js';
import { Roles } from '../identity/roles.decorator.js';
import { ReviewPrescriptionDto } from './dto/review-prescription.dto.js';
import { PrescriptionService } from './prescription.service.js';

interface AuthenticatedRequest extends Request {
    user: { id: string; role: string };
}

type UploadedFile = {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
};

const MAX_PRESCRIPTION_BYTES = Number(
    process.env.SHAFAQ_PRESCRIPTION_MAX_BYTES ??
        String(10 * 1024 * 1024),
);

const prescriptionUploadInterceptor = FileInterceptor(
    'file',
    {
        limits: {
            fileSize: MAX_PRESCRIPTION_BYTES,
            files: 1,
        },
        fileFilter: (_request, file, callback) => {
            callback(
                null,
                ['image/jpeg', 'image/png', 'image/webp'].includes(
                    file.mimetype,
                ),
            );
        },
    },
);

@Controller('api/v1')
export class PrescriptionController {
    constructor(
        private readonly prescriptionService: PrescriptionService,
    ) {}

    @Post('orders/:orderId/prescription')
    @UseGuards(CustomerIdentityGuard, RolesGuard)
    @Roles('CUSTOMER')
    @UseInterceptors(prescriptionUploadInterceptor)
    async upload(
        @Req() request: AuthenticatedRequest,
        @Param('orderId') orderId: string,
        @UploadedFile() file: UploadedFile | undefined,
    ) {
        return this.prescriptionService.upload(
            orderId,
            request.user.id,
            file,
        );
    }

    @Get('orders/:orderId/prescription')
    @UseGuards(IdentityGuard)
    async getForOrder(
        @Req() request: AuthenticatedRequest,
        @Param('orderId') orderId: string,
    ) {
        const baseUrl =
            request.protocol + '://' + request.get('host');

        return this.prescriptionService.getForOrder(
            orderId,
            request.user.id,
            request.user.role,
            baseUrl,
        );
    }

    @Post('prescriptions/:prescriptionId/review')
    @UseGuards(InternalIdentityGuard, RolesGuard)
    @Roles('OWNER', 'PHARMACIST')
    async review(
        @Req() request: AuthenticatedRequest,
        @Param('prescriptionId') prescriptionId: string,
        @Body() dto: ReviewPrescriptionDto,
    ) {
        return this.prescriptionService.review(
            prescriptionId,
            request.user.id,
            request.user.role,
            dto,
        );
    }

    @Post('prescriptions/:prescriptionId/reupload')
    @UseGuards(CustomerIdentityGuard, RolesGuard)
    @Roles('CUSTOMER')
    @UseInterceptors(prescriptionUploadInterceptor)
    async reupload(
        @Req() request: AuthenticatedRequest,
        @Param('prescriptionId') prescriptionId: string,
        @UploadedFile() file: UploadedFile | undefined,
    ) {
        return this.prescriptionService.reupload(
            prescriptionId,
            request.user.id,
            file,
        );
    }

    @Get('prescriptions/file')
    async getFile(@Req() request: Request) {
        const token = request.query.token;

        if (typeof token !== 'string') {
            throw new BadRequestException(
                'Signed file token is required',
            );
        }

        const file =
            await this.prescriptionService.getSignedFile(token);

        const type = file.storageKey.endsWith('.jpg')
            ? 'image/jpeg'
            : file.storageKey.endsWith('.png')
                ? 'image/png'
                : file.storageKey.endsWith('.webp')
                    ? 'image/webp'
                    : 'application/octet-stream';

        return new StreamableFile(file.bytes, {
            type,
            disposition: 'inline',
        });
    }
}
