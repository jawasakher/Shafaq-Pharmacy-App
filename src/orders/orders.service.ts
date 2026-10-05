import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';

@Injectable()
export class OrdersService {
    constructor(private readonly prisma: PrismaService) {}

    async createOrder(customerId: string, dto: CreateOrderDto) {
        const customer = await this.prisma.user.findUnique({
            where: { id: customerId },
            select: {
                id: true,
                role: true,
            },
        });

        if (!customer) {
            throw new NotFoundException('Customer not found');
        }

        if (customer.role !== 'CUSTOMER') {
            throw new BadRequestException(
                'Only customers can create orders',
            );
        }

        if (!dto.items || dto.items.length === 0) {
            throw new BadRequestException(
                'Order must contain at least one medicine',
            );
        }

        const pharmacy = await this.prisma.pharmacy.findUnique({
            where: { id: dto.pharmacyId },
            select: {
                id: true,
                name: true,
                approvalStatus: true,
                operationalStatus: true,
            },
        });

        if (!pharmacy) {
            throw new NotFoundException('Pharmacy not found');
        }

        if (pharmacy.approvalStatus !== 'APPROVED') {
            throw new BadRequestException(
                'Pharmacy is not approved',
            );
        }

        if (pharmacy.operationalStatus !== 'OPEN') {
            throw new BadRequestException(
                'Pharmacy is currently closed',
            );
        }

        const order = await this.prisma.$transaction(async (tx) =>
            tx.order.create({
                data: {
                    customerId,
                    pharmacyId: dto.pharmacyId,
                    status: 'PENDING',
                    deliveryAddress: dto.deliveryAddress,
                    deliveryLatitude: dto.deliveryLatitude,
                    deliveryLongitude: dto.deliveryLongitude,
                    items: {
                        create: dto.items.map((item) => ({
                            medicineName: item.medicineName.trim(),
                            quantity: item.quantity,
                            status: 'PENDING',
                        })),
                    },
                    assignments: {
                        create: {
                            pharmacyId: dto.pharmacyId,
                            status: 'OFFERED',
                        },
                    },
                },
                include: {
                    items: true,
                    pharmacy: {
                        select: {
                            id: true,
                            name: true,
                            approvalStatus: true,
                            operationalStatus: true,
                        },
                    },
                    assignments: {
                        select: {
                            id: true,
                            pharmacyId: true,
                            status: true,
                            offeredAt: true,
                        },
                    },
                },
            }),
        );

        return {
            id: order.id,
            status: order.status,
            pharmacy: order.pharmacy,
            deliveryAddress: order.deliveryAddress,
            deliveryLatitude: order.deliveryLatitude,
            deliveryLongitude: order.deliveryLongitude,
            items: order.items,
            assignments: order.assignments,
            medicineSubtotal: order.medicineSubtotal,
            createdAt: order.createdAt,
        };
    }

    async acceptPharmacyAssignment(
        assignmentId: string,
        actorUserId: string,
    ) {
        return this.prisma.$transaction(async (tx) => {
            const assignment =
                await tx.pharmacyAssignment.findUnique({
                    where: { id: assignmentId },
                    select: {
                        id: true,
                        orderId: true,
                        pharmacyId: true,
                    },
                });

            if (!assignment) {
                throw new NotFoundException(
                    'Pharmacy assignment not found',
                );
            }

            const membership =
                await tx.pharmacyMember.findFirst({
                    where: {
                        pharmacyId: assignment.pharmacyId,
                        userId: actorUserId,
                        status: 'ACTIVE',
                    },
                    select: {
                        id: true,
                    },
                });

            if (!membership) {
                throw new BadRequestException(
                    'User is not an active pharmacy member',
                );
            }

            const activated =
                await tx.pharmacyAssignment.updateMany({
                    where: {
                        id: assignment.id,
                        status: 'OFFERED',
                    },
                    data: {
                        status: 'ACTIVE',
                        activatedAt: new Date(),
                    },
                });

            if (activated.count !== 1) {
                throw new BadRequestException(
                    'Pharmacy assignment is no longer available',
                );
            }

            const order = await tx.order.updateMany({
                where: {
                    id: assignment.orderId,
                    status: 'PENDING',
                },
                data: {
                    status: 'PHARMACY_REVIEWING',
                },
            });

            if (order.count !== 1) {
                throw new BadRequestException(
                    'Order is no longer available for pharmacy review',
                );
            }

            return tx.pharmacyAssignment.findUniqueOrThrow({
                where: {
                    id: assignment.id,
                },
                include: {
                    order: {
                        select: {
                            id: true,
                            status: true,
                        },
                    },
                },
            });
        });
    }
}
