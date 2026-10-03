import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

export type PharmacyApplicationInput = {
    name: string;
    phone?: string;
    address: string;
    latitude: number;
    longitude: number;
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
                where: { id: userId },
                data: { role: 'OWNER' },
            });

            return pharmacy;
        });
    }
}
