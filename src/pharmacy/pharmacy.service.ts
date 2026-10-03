import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

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
}