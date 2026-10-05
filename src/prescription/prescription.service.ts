import {
    BadRequestException,
    ConflictException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ReviewPrescriptionDto } from './dto/review-prescription.dto.js';
import {
    PRIVATE_STORAGE,
    type PrivateStoragePort,
} from './storage/private-storage.port.js';

const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
]);

const MIME_EXTENSIONS: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
};

type UploadedFile = {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
};

@Injectable()
export class PrescriptionService {
    constructor(
        private readonly prisma: PrismaService,
        @Inject(PRIVATE_STORAGE)
        private readonly storage: PrivateStoragePort,
    ) {}

    async upload(
        orderId: string,
        customerId: string,
        file: UploadedFile | undefined,
    ) {
        this.validateFile(file);

        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                customerId: true,
                prescription: { select: { id: true } },
            },
        });

        if (!order) throw new NotFoundException('Order not found');
        if (order.customerId !== customerId) {
            throw new BadRequestException('Order does not belong to the customer');
        }
        if (order.prescription) {
            throw new ConflictException(
                'Prescription already exists for this order; use reupload after a reupload request',
            );
        }

        const stored = await this.storage.put({
            bytes: file.buffer,
            extension: MIME_EXTENSIONS[file.mimetype],
        });

        try {
            return await this.prisma.$transaction(async (tx) => {
                const prescription = await tx.prescription.create({
                    data: {
                        orderId,
                        status: 'UPLOADED',
                        versions: {
                            create: {
                                version: 1,
                                storageKey: stored.storageKey,
                                originalFileName: this.safeOriginalFileName(file.originalname),
                                mimeType: file.mimetype,
                                sizeBytes: stored.sizeBytes,
                                uploadedByUserId: customerId,
                                status: 'UPLOADED',
                            },
                        },
                    },
                    include: {
                        versions: {
                            orderBy: { version: 'desc' },
                            take: 1,
                        },
                    },
                });

                return this.toResponse(prescription);
            });
        } catch (error) {
            await this.storage.delete(stored.storageKey);
            throw error;
        }
    }

    async reupload(
        prescriptionId: string,
        customerId: string,
        file: UploadedFile | undefined,
    ) {
        this.validateFile(file);

        const prescription = await this.prisma.prescription.findUnique({
            where: { id: prescriptionId },
            include: {
                order: { select: { customerId: true } },
                versions: {
                    orderBy: { version: 'desc' },
                    take: 1,
                },
            },
        });

        if (!prescription) throw new NotFoundException('Prescription not found');
        if (prescription.order.customerId !== customerId) {
            throw new BadRequestException('Prescription does not belong to the customer');
        }
        if (prescription.status !== 'REUPLOAD_REQUIRED') {
            throw new ConflictException('Prescription is not awaiting reupload');
        }

        const latest = prescription.versions[0];
        if (!latest) throw new ConflictException('Prescription has no previous version');

        const stored = await this.storage.put({
            bytes: file.buffer,
            extension: MIME_EXTENSIONS[file.mimetype],
        });

        try {
            return await this.prisma.$transaction(async (tx) => {
                const updated = await tx.prescription.update({
                    where: { id: prescriptionId },
                    data: {
                        status: 'UPLOADED',
                        versions: {
                            create: {
                                version: latest.version + 1,
                                storageKey: stored.storageKey,
                                originalFileName: this.safeOriginalFileName(file.originalname),
                                mimeType: file.mimetype,
                                sizeBytes: stored.sizeBytes,
                                uploadedByUserId: customerId,
                                status: 'UPLOADED',
                            },
                        },
                    },
                    include: {
                        versions: {
                            orderBy: { version: 'desc' },
                            take: 1,
                        },
                    },
                });

                return this.toResponse(updated);
            });
        } catch (error) {
            await this.storage.delete(stored.storageKey);
            throw error;
        }
    }

    async getForOrder(
        orderId: string,
        actorUserId: string,
        actorRole: string,
        baseUrl: string,
    ) {
        const prescription = await this.prisma.prescription.findUnique({
            where: { orderId },
            include: {
                order: {
                    select: {
                        customerId: true,
                        assignments: {
                            where: { status: 'ACTIVE' },
                            select: { pharmacyId: true },
                            take: 1,
                        },
                    },
                },
                versions: {
                    orderBy: { version: 'desc' },
                    take: 1,
                },
            },
        });

        if (!prescription) throw new NotFoundException('Prescription not found');

        await this.assertReadAccess(
            prescription.order,
            actorUserId,
            actorRole,
        );

        const latest = prescription.versions[0];

        return {
            ...this.toResponse(prescription),
            downloadUrl: latest
                ? this.createSignedUrl(latest.storageKey, baseUrl)
                : null,
        };
    }

    async review(
        prescriptionId: string,
        actorUserId: string,
        actorRole: string,
        dto: ReviewPrescriptionDto,
    ) {
        if (actorRole !== 'OWNER' && actorRole !== 'PHARMACIST') {
            throw new BadRequestException('Only pharmacy staff can review prescriptions');
        }

        const prescription = await this.prisma.prescription.findUnique({
            where: { id: prescriptionId },
            include: {
                order: {
                    select: {
                        assignments: {
                            where: { status: 'ACTIVE' },
                            select: { pharmacyId: true },
                            take: 1,
                        },
                    },
                },
                versions: {
                    orderBy: { version: 'desc' },
                    take: 1,
                },
            },
        });

        if (!prescription) throw new NotFoundException('Prescription not found');

        const pharmacyId = prescription.order.assignments[0]?.pharmacyId;
        if (!pharmacyId) {
            throw new ConflictException('Order has no active pharmacy assignment');
        }

        const membership = await this.prisma.pharmacyMember.findFirst({
            where: {
                pharmacyId,
                userId: actorUserId,
                status: 'ACTIVE',
            },
            select: { id: true },
        });

        if (!membership) {
            throw new BadRequestException('User is not an active pharmacy member');
        }

        const version = prescription.versions[0];
        if (!version) throw new ConflictException('Prescription has no uploaded version');

        if (
            prescription.status !== 'UPLOADED' &&
            prescription.status !== 'UNDER_REVIEW'
        ) {
            throw new ConflictException('Prescription is not available for review');
        }

        if (dto.decision === 'REUPLOAD' && !dto.rejectionReason?.trim()) {
            throw new BadRequestException(
                'Rejection reason is required when reupload is requested',
            );
        }

        const nextStatus =
            dto.decision === 'ACCEPT'
                ? 'ACCEPTED'
                : 'REUPLOAD_REQUIRED';

        return this.prisma.$transaction(async (tx) => {
            const updatedVersion = await tx.prescriptionVersion.update({
                where: { id: version.id },
                data: {
                    status: nextStatus,
                    rejectionReason:
                        dto.decision === 'REUPLOAD'
                            ? dto.rejectionReason?.trim()
                            : null,
                    reviewNotes: dto.reviewNotes?.trim() || null,
                    reviewedByUserId: actorUserId,
                    reviewedAt: new Date(),
                },
            });

            await tx.prescription.update({
                where: { id: prescriptionId },
                data: { status: nextStatus },
            });

            return {
                prescriptionId,
                status: nextStatus,
                version: updatedVersion.version,
                rejectionReason: updatedVersion.rejectionReason,
                reviewNotes: updatedVersion.reviewNotes,
                reviewedAt: updatedVersion.reviewedAt,
            };
        });
    }

    async getSignedFile(token: string) {
        const signed = this.storage.verifySignedToken(token);
        const bytes = await this.storage.read(signed.storageKey);
        return {
            bytes,
            storageKey: signed.storageKey,
        };
    }

    private createSignedUrl(storageKey: string, baseUrl: string) {
        const ttlSeconds = Number(
            process.env.SHAFAQ_PRESCRIPTION_SIGNED_URL_TTL_SECONDS ?? '300',
        );

        if (!Number.isSafeInteger(ttlSeconds) || ttlSeconds <= 0) {
            throw new BadRequestException(
                'Invalid prescription signed URL TTL configuration',
            );
        }

        const expiresAt = Date.now() + ttlSeconds * 1000;
        const token = this.storage.createSignedToken(storageKey, expiresAt);

        return (
            baseUrl +
            '/api/v1/prescriptions/file?token=' +
            encodeURIComponent(token)
        );
    }

    private validateFile(file: UploadedFile | undefined): asserts file is UploadedFile {
        if (!file) throw new BadRequestException('Prescription file is required');

        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
            throw new BadRequestException(
                'Prescription file must be JPEG, PNG, or WebP',
            );
        }

        if (!this.hasValidImageSignature(file.buffer, file.mimetype)) {
            throw new BadRequestException(
                'Prescription file content does not match its declared image type',
            );
        }

        const maxBytes = Number(
            process.env.SHAFAQ_PRESCRIPTION_MAX_BYTES ??
                String(10 * 1024 * 1024),
        );

        if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
            throw new BadRequestException(
                'Invalid prescription file size configuration',
            );
        }

        if (file.size > maxBytes) {
            throw new BadRequestException(
                'Prescription file exceeds the configured maximum size',
            );
        }
    }

    private hasValidImageSignature(
        bytes: Buffer,
        mimeType: string,
    ) {
        if (mimeType === 'image/png') {
            return (
                bytes.length >= 8 &&
                bytes.subarray(0, 8).equals(
                    Buffer.from([
                        0x89, 0x50, 0x4e, 0x47,
                        0x0d, 0x0a, 0x1a, 0x0a,
                    ]),
                )
            );
        }

        if (mimeType === 'image/jpeg') {
            return (
                bytes.length >= 3 &&
                bytes[0] === 0xff &&
                bytes[1] === 0xd8 &&
                bytes[2] === 0xff
            );
        }

        if (mimeType === 'image/webp') {
            return (
                bytes.length >= 12 &&
                bytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
                bytes.subarray(8, 12).toString('ascii') === 'WEBP'
            );
        }

        return false;
    }

    private safeOriginalFileName(name: string) {
        return (
            name.replace(/[\\/\u0000]/g, '_').trim().slice(0, 255) ||
            'prescription'
        );
    }

    private async assertReadAccess(
        order: {
            customerId: string;
            assignments: Array<{ pharmacyId: string }>;
        },
        actorUserId: string,
        actorRole: string,
    ) {
        if (actorRole === 'CUSTOMER') {
            if (order.customerId !== actorUserId) {
                throw new BadRequestException('Order does not belong to the customer');
            }
            return;
        }

        if (actorRole !== 'OWNER' && actorRole !== 'PHARMACIST') {
            throw new BadRequestException(
                'Only the customer and responsible pharmacy staff can access prescriptions',
            );
        }

        const pharmacyId = order.assignments[0]?.pharmacyId;
        if (!pharmacyId) {
            throw new ConflictException('Order has no active pharmacy assignment');
        }

        const membership = await this.prisma.pharmacyMember.findFirst({
            where: {
                pharmacyId,
                userId: actorUserId,
                status: 'ACTIVE',
            },
            select: { id: true },
        });

        if (!membership) {
            throw new BadRequestException(
                'User is not an active member of the responsible pharmacy',
            );
        }
    }

    private toResponse(prescription: {
        id: string;
        orderId: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        versions: Array<{
            id: string;
            version: number;
            originalFileName: string;
            mimeType: string;
            sizeBytes: number;
            uploadedAt: Date;
            status: string;
            rejectionReason: string | null;
            reviewNotes: string | null;
            reviewedByUserId: string | null;
            reviewedAt: Date | null;
        }>;
    }) {
        const latest = prescription.versions[0];

        return {
            id: prescription.id,
            orderId: prescription.orderId,
            status: prescription.status,
            latestVersion: latest
                ? {
                    id: latest.id,
                    version: latest.version,
                    originalFileName: latest.originalFileName,
                    mimeType: latest.mimeType,
                    sizeBytes: latest.sizeBytes,
                    uploadedAt: latest.uploadedAt,
                    status: latest.status,
                    rejectionReason: latest.rejectionReason,
                    reviewNotes: latest.reviewNotes,
                    reviewedByUserId: latest.reviewedByUserId,
                    reviewedAt: latest.reviewedAt,
                }
                : null,
            createdAt: prescription.createdAt,
            updatedAt: prescription.updatedAt,
        };
    }
}
