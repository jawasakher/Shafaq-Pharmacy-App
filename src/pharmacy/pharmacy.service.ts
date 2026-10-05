
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

export type PharmacyApplicationInput = {
    name: string;
    phone?: string;
    address: string;
    latitude: number;
    longitude: number;
};

export type PharmacyMemberInput = {
    userId: string;
};

@Injectable()
export class PharmacyService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll() {
        return this.prisma.pharmacy.findMany({
            where: {
                approvalStatus: 'APPROVED',
                operationalStatus: 'OPEN',
            },
            orderBy: {
                name: 'asc',
            },
            select: {
                id: true,
                name: true,
                phone: true,
                address: true,
                latitude: true,
                longitude: true,
                approvalStatus: true,
                operationalStatus: true,
            },
        });
    }

    async listApplications() {
        return this.prisma.pharmacy.findMany({
            where: {
                approvalStatus: 'PENDING_APPROVAL',
            },
            orderBy: {
                createdAt: 'asc',
            },
            select: {
                id: true,
                name: true,
                phone: true,
                address: true,
                latitude: true,
                longitude: true,
                approvalStatus: true,
                operationalStatus: true,
                createdAt: true,
            },
        });
    }

    async listPharmacists(
        pharmacyId: string,
        actorUserId: string,
        actorRole: string,
    ) {
        await this.assertManagementAccess(
            pharmacyId,
            actorUserId,
            actorRole,
        );

        return this.prisma.pharmacyMember.findMany({
            where: {
                pharmacyId,
                role: 'PHARMACIST',
            },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                userId: true,
                role: true,
                status: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        phone: true,
                        name: true,
                        role: true,
                    },
                },
            },
        });
    }

    async addPharmacist(
        pharmacyId: string,
        userId: string,
        actorUserId: string,
        actorRole: string,
    ) {
        await this.assertManagementAccess(
            pharmacyId,
            actorUserId,
            actorRole,
        );

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.role !== 'PHARMACIST') {
            throw new BadRequestException(
                'Only pharmacist users can be added to a pharmacy',
            );
        }

        const existing = await this.prisma.pharmacyMember.findUnique({
            where: {
                pharmacyId_userId: { pharmacyId, userId },
            },
            select: { id: true, role: true, status: true },
        });

        if (existing) {
            if (existing.role !== 'PHARMACIST') {
                throw new BadRequestException(
                    'The user is already an owner of this pharmacy',
                );
            }

            if (existing.status === 'ACTIVE') {
                throw new BadRequestException(
                    'User is already an active pharmacist',
                );
            }

            return this.prisma.pharmacyMember.update({
                where: { id: existing.id },
                data: { status: 'ACTIVE' },
                select: {
                    id: true,
                    pharmacyId: true,
                    userId: true,
                    role: true,
                    status: true,
                },
            });
        }

        return this.prisma.pharmacyMember.create({
            data: {
                pharmacyId,
                userId,
                role: 'PHARMACIST',
                status: 'ACTIVE',
            },
            select: {
                id: true,
                pharmacyId: true,
                userId: true,
                role: true,
                status: true,
            },
        });
    }

    async removePharmacist(
        pharmacyId: string,
        userId: string,
        actorUserId: string,
        actorRole: string,
    ) {
        await this.assertManagementAccess(
            pharmacyId,
            actorUserId,
            actorRole,
        );

        const membership = await this.prisma.pharmacyMember.findUnique({
            where: {
                pharmacyId_userId: { pharmacyId, userId },
            },
            select: { id: true, role: true, status: true },
        });

        if (!membership) {
            throw new NotFoundException('Pharmacy membership not found');
        }

        if (membership.role !== 'PHARMACIST') {
            throw new BadRequestException(
                'Owner membership requires a documented ownership transfer',
            );
        }

        if (membership.status === 'INACTIVE') {
            throw new BadRequestException(
                'Pharmacist membership is already inactive',
            );
        }

        return this.prisma.pharmacyMember.update({
            where: { id: membership.id },
            data: { status: 'INACTIVE' },
            select: {
                id: true,
                pharmacyId: true,
                userId: true,
                role: true,
                status: true,
            },
        });
    }

    async approveApplication(pharmacyId: string) {
        return this.transitionApproval(
            pharmacyId,
            'PENDING_APPROVAL',
            'APPROVED',
        );
    }

    async rejectApplication(pharmacyId: string) {
        return this.transitionApproval(
            pharmacyId,
            'PENDING_APPROVAL',
            'REJECTED',
        );
    }

    async suspendPharmacy(pharmacyId: string) {
        return this.transitionApproval(
            pharmacyId,
            'APPROVED',
            'SUSPENDED',
        );
    }

    async openPharmacy(
        pharmacyId: string,
        actorUserId: string,
        actorRole: 'OWNER' | 'ADMIN',
    ) {
        if (actorRole === 'OWNER') {
            await this.assertActiveOwner(
                pharmacyId,
                actorUserId,
            );
        }

        const result = await this.prisma.pharmacy.updateMany({
            where: {
                id: pharmacyId,
                approvalStatus: 'APPROVED',
                operationalStatus: 'CLOSED',
            },
            data: {
                operationalStatus: 'OPEN',
            },
        });

        if (result.count === 0) {
            await this.assertPharmacyExists(pharmacyId);

            throw new BadRequestException(
                'Pharmacy cannot be opened from its current state',
            );
        }

        return this.prisma.pharmacy.findUniqueOrThrow({
            where: {
                id: pharmacyId,
            },
            select: {
                id: true,
                name: true,
                approvalStatus: true,
                operationalStatus: true,
            },
        });
    }

    async closePharmacy(
        pharmacyId: string,
        actorUserId: string,
        actorRole: 'OWNER' | 'ADMIN',
    ) {
        if (actorRole === 'OWNER') {
            await this.assertActiveOwner(
                pharmacyId,
                actorUserId,
            );
        }

        const result = await this.prisma.pharmacy.updateMany({
            where: {
                id: pharmacyId,
                operationalStatus: 'OPEN',
            },
            data: {
                operationalStatus: 'CLOSED',
            },
        });

        if (result.count === 0) {
            await this.assertPharmacyExists(pharmacyId);

            throw new BadRequestException(
                'Pharmacy cannot be closed from its current state',
            );
        }

        return this.prisma.pharmacy.findUniqueOrThrow({
            where: {
                id: pharmacyId,
            },
            select: {
                id: true,
                name: true,
                approvalStatus: true,
                operationalStatus: true,
            },
        });
    }

    private async transitionApproval(
        pharmacyId: string,
        expectedStatus:
            | 'PENDING_APPROVAL'
            | 'APPROVED',
        nextStatus:
            | 'APPROVED'
            | 'REJECTED'
            | 'SUSPENDED',
    ) {
        const result = await this.prisma.pharmacy.updateMany({
            where: {
                id: pharmacyId,
                approvalStatus: expectedStatus,
            },
            data: {
                approvalStatus: nextStatus,
                ...(nextStatus === 'SUSPENDED'
                    ? {
                        operationalStatus: 'CLOSED',
                    }
                    : {}),
            },
        });

        if (result.count === 0) {
            const pharmacy =
                await this.prisma.pharmacy.findUnique({
                    where: {
                        id: pharmacyId,
                    },
                    select: {
                        id: true,
                        approvalStatus: true,
                    },
                });

            if (!pharmacy) {
                throw new NotFoundException(
                    'Pharmacy not found',
                );
            }

            throw new BadRequestException(
                `Invalid pharmacy approval transition from ${pharmacy.approvalStatus}`,
            );
        }

        return this.prisma.pharmacy.findUniqueOrThrow({
            where: {
                id: pharmacyId,
            },
            select: {
                id: true,
                name: true,
                approvalStatus: true,
                operationalStatus: true,
            },
        });
    }

    async submitApplication(
        userId: string,
        input: PharmacyApplicationInput,
    ) {
        return this.prisma.$transaction(async (tx) => {
            const pharmacy = await tx.pharmacy.create({
                data: {
                    name: input.name.trim(),
                    phone: input.phone?.trim() || null,
                    address: input.address.trim(),
                    latitude: input.latitude,
                    longitude: input.longitude,
                    approvalStatus: 'PENDING_APPROVAL',
                    operationalStatus: 'CLOSED',

                    members: {
                        create: {
                            userId,
                            role: 'OWNER',
                            status: 'ACTIVE',
                        },
                    },
                },

                select: {
                    id: true,
                    name: true,
                    phone: true,
                    address: true,
                    latitude: true,
                    longitude: true,
                    approvalStatus: true,
                    operationalStatus: true,

                    members: {
                        where: {
                            userId,
                            status: 'ACTIVE',
                        },
                        select: {
                            role: true,
                            status: true,
                        },
                    },
                },
            });

            await tx.user.update({
                where: {
                    id: userId,
                },
                data: {
                    role: 'OWNER',
                },
            });

            return pharmacy;
        });
    }

    private async assertActiveOwner(
        pharmacyId: string,
        userId: string,
    ) {
        const membership =
            await this.prisma.pharmacyMember.findFirst({
                where: {
                    pharmacyId,
                    userId,
                    role: 'OWNER',
                    status: 'ACTIVE',
                },
                select: {
                    id: true,
                },
            });

        if (!membership) {
            throw new NotFoundException(
                'Pharmacy not found',
            );
        }
    }

    private async assertManagementAccess(
        pharmacyId: string,
        actorUserId: string,
        actorRole: string,
    ) {
        if (actorRole === 'ADMIN') {
            await this.assertPharmacyExists(pharmacyId);
            return;
        }

        await this.assertActiveOwner(pharmacyId, actorUserId);
    }

    private async assertPharmacyExists(
        pharmacyId: string,
    ) {
        const pharmacy =
            await this.prisma.pharmacy.findUnique({
                where: {
                    id: pharmacyId,
                },
                select: {
                    id: true,
                },
            });

        if (!pharmacy) {
            throw new NotFoundException(
                'Pharmacy not found',
            );
        }
    }
}
