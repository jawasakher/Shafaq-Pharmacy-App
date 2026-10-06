import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { DeliveryPricingService } from './delivery-pricing.service.js';
import { PharmacyQuoteDto } from './dto/pharmacy-quote.dto.js';
import { OrderStateService } from './order-state.service.js';

@Injectable()
export class OrdersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly deliveryPricing: DeliveryPricingService,
        private readonly orderState: OrderStateService,
    ) {}

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

        return this.toOrderResponse(order);
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

            await this.requireActivePharmacyMembership(
                tx,
                assignment.pharmacyId,
                actorUserId,
            );

            const order =
                await tx.order.findUnique({
                    where: { id: assignment.orderId },
                    select: {
                        id: true,
                        status: true,
                    },
                });

            if (!order) {
                throw new NotFoundException(
                    'Order not found',
                );
            }

            if (
                order.status !== 'PENDING' &&
                order.status !== 'PHARMACY_REVIEWING'
            ) {
                throw new ConflictException(
                    'Order is not available for pharmacy assignment acceptance',
                );
            }

            if (
                order.status ===
                'PHARMACY_REVIEWING'
            ) {
                const previousAssignment =
                    await tx.pharmacyAssignment.findFirst({
                        where: {
                            orderId: order.id,
                            id: {
                                not: assignment.id,
                            },
                            status: 'ACTIVE',
                        },
                        select: {
                            id: true,
                            pharmacyId: true,
                        },
                    });

                if (!previousAssignment) {
                    throw new ConflictException(
                        'Order has no previous active pharmacy assignment',
                    );
                }

                const transferred =
                    await tx.pharmacyAssignment.updateMany({
                        where: {
                            id: previousAssignment.id,
                            status: 'ACTIVE',
                        },
                        data: {
                            status: 'TRANSFERRED',
                            transferredAt:
                                new Date(),
                        },
                    });

                if (transferred.count !== 1) {
                    throw new ConflictException(
                        'Order responsibility changed before transfer acceptance',
                    );
                }

                await tx.order.update({
                    where: { id: order.id },
                    data: {
                        medicineSubtotal: null,
                        deliveryFee: null,
                        totalAmount: null,
                        pricingOriginPharmacyId:
                            null,
                        pricingOriginLatitude:
                            null,
                        pricingOriginLongitude:
                            null,
                        pricingDistance: null,
                        pricingDistanceUnit: null,
                        pricingCalculatedAt:
                            null,
                        pricingQuoteAt: null,
                        pricingSupported: null,
                        pricingConfigurationVersion:
                            null,
                        pricingStrategy: null,
                        pricingConfigurationRef:
                            null,
                    },
                });
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
                throw new ConflictException(
                    'Pharmacy assignment is no longer available',
                );
            }

            if (order.status === 'PENDING') {
                await this.orderState.transition(tx, {
                    orderId: order.id,
                    from: 'PENDING',
                    to: 'PHARMACY_REVIEWING',
                    actorUserId,
                    reason: 'Pharmacy assignment accepted',
                });
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

    async requestOrderTransfer(
        orderId: string,
        actorUserId: string,
        targetPharmacyId: string,
    ) {
        return this.prisma.$transaction(async (tx) => {
            const order =
                await tx.order.findUnique({
                    where: { id: orderId },
                    select: {
                        id: true,
                        status: true,
                    },
                });

            if (!order) {
                throw new NotFoundException(
                    'Order not found',
                );
            }

            if (
                order.status !==
                'PHARMACY_REVIEWING'
            ) {
                throw new ConflictException(
                    'Order is not available for pharmacy transfer',
                );
            }

            const currentAssignment =
                await this.getActiveAssignment(
                    tx,
                    order.id,
                );

            await this.requireActivePharmacyMembership(
                tx,
                currentAssignment.pharmacyId,
                actorUserId,
            );

            if (
                currentAssignment.pharmacyId ===
                targetPharmacyId
            ) {
                throw new BadRequestException(
                    'Target pharmacy must be different from the current pharmacy',
                );
            }

            const targetPharmacy =
                await tx.pharmacy.findUnique({
                    where: {
                        id: targetPharmacyId,
                    },
                    select: {
                        id: true,
                        approvalStatus: true,
                        operationalStatus: true,
                    },
                });

            if (!targetPharmacy) {
                throw new NotFoundException(
                    'Target pharmacy not found',
                );
            }

            if (
                targetPharmacy.approvalStatus !==
                'APPROVED' ||
                targetPharmacy.operationalStatus !==
                    'OPEN'
            ) {
                throw new BadRequestException(
                    'Target pharmacy is not eligible to receive orders',
                );
            }

            const existingOffer =
                await tx.pharmacyAssignment.findFirst({
                    where: {
                        orderId: order.id,
                        pharmacyId:
                            targetPharmacyId,
                        status: 'OFFERED',
                    },
                    select: {
                        id: true,
                    },
                });

            if (existingOffer) {
                throw new ConflictException(
                    'A transfer offer already exists for the target pharmacy',
                );
            }

            const assignment =
                await tx.pharmacyAssignment.create({
                    data: {
                        orderId: order.id,
                        pharmacyId:
                            targetPharmacyId,
                        status: 'OFFERED',
                    },
                });

            return assignment;
        });
    }

    async listPharmacyAssignmentOffers(
        actorUserId: string,
    ) {
        const memberships =
            await this.prisma.pharmacyMember.findMany({
                where: {
                    userId: actorUserId,
                    status: 'ACTIVE',
                },
                select: {
                    pharmacyId: true,
                },
            });

        const pharmacyIds =
            memberships.map(
                (membership) =>
                    membership.pharmacyId,
            );

        if (pharmacyIds.length === 0) {
            return [];
        }

        return this.prisma.pharmacyAssignment.findMany({
            where: {
                pharmacyId: {
                    in: pharmacyIds,
                },
                status: 'OFFERED',
                order: {
                    status: 'PHARMACY_REVIEWING',
                },
            },
            orderBy: {
                offeredAt: 'asc',
            },
            include: {
                order: {
                    include: {
                        items: true,
                    },
                },
            },
        });
    }

    async rejectPharmacyAssignment(
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
                        status: true,
                    },
                });

            if (!assignment) {
                throw new NotFoundException(
                    'Pharmacy assignment not found',
                );
            }

            await this.requireActivePharmacyMembership(
                tx,
                assignment.pharmacyId,
                actorUserId,
            );

            if (assignment.status !== 'OFFERED') {
                throw new ConflictException(
                    'Pharmacy assignment is not available for rejection',
                );
            }

            const order =
                await tx.order.findUnique({
                    where: { id: assignment.orderId },
                    select: {
                        id: true,
                        status: true,
                    },
                });

            if (!order) {
                throw new NotFoundException(
                    'Order not found',
                );
            }

            if (
                order.status !==
                'PHARMACY_REVIEWING'
            ) {
                throw new ConflictException(
                    'Only transfer offers can be rejected in the current order state',
                );
            }

            const rejected =
                await tx.pharmacyAssignment.updateMany({
                    where: {
                        id: assignment.id,
                        status: 'OFFERED',
                    },
                    data: {
                        status: 'REJECTED',
                        rejectedAt: new Date(),
                    },
                });

            if (rejected.count !== 1) {
                throw new ConflictException(
                    'Pharmacy assignment changed before rejection',
                );
            }

            return tx.pharmacyAssignment.findUniqueOrThrow({
                where: {
                    id: assignment.id,
                },
            });
        });
    }

    async startPharmacyReview(
        orderId: string,
        actorUserId: string,
    ) {
        return this.prisma.$transaction(async (tx) => {
            const order =
                await tx.order.findUnique({
                    where: { id: orderId },
                    select: {
                        id: true,
                        status: true,
                    },
                });

            if (!order) {
                throw new NotFoundException(
                    'Order not found',
                );
            }

            const assignment =
                await this.getActiveAssignment(
                    tx,
                    order.id,
                );

            await this.requireActivePharmacyMembership(
                tx,
                assignment.pharmacyId,
                actorUserId,
            );

            if (order.status === 'PHARMACY_REVIEWING') {
                return this.getOrderForResponse(
                    tx,
                    order.id,
                );
            }

            if (order.status !== 'PENDING') {
                throw new ConflictException(
                    'Order is not available to start pharmacy review',
                );
            }

            await this.orderState.transition(tx, {
                orderId: order.id,
                from: 'PENDING',
                to: 'PHARMACY_REVIEWING',
                actorUserId,
                reason: 'Pharmacy review started',
            });

            return this.getOrderForResponse(
                tx,
                order.id,
            );
        });
    }

    async quotePharmacyOrder(
        orderId: string,
        actorUserId: string,
        dto: PharmacyQuoteDto,
    ) {
        return this.prisma.$transaction(async (tx) => {
            const order =
                await tx.order.findUnique({
                    where: { id: orderId },
                    include: {
                        items: true,
                    },
                });

            if (!order) {
                throw new NotFoundException(
                    'Order not found',
                );
            }

            if (order.status !== 'PHARMACY_REVIEWING') {
                throw new ConflictException(
                    'Order is not available for pharmacy quote',
                );
            }

            const assignment =
                await this.getActiveAssignment(
                    tx,
                    order.id,
                );

            await this.requireActivePharmacyMembership(
                tx,
                assignment.pharmacyId,
                actorUserId,
            );

            this.validateQuoteItems(
                order.items,
                dto.items,
            );

            const quotedItems = new Map(
                dto.items.map((item) => [
                    item.orderItemId,
                    item,
                ]),
            );

            const hasUnavailableItem =
                order.items.some(
                    (item) =>
                        !quotedItems.get(item.id)?.available,
                );

            for (const orderItem of order.items) {
                const quote = quotedItems.get(orderItem.id)!;

                if (!quote.available) {
                    await tx.orderItem.update({
                        where: { id: orderItem.id },
                        data: {
                            status: 'UNAVAILABLE',
                            unitPrice: null,
                            totalPrice: null,
                        },
                    });
                    continue;
                }

                if (
                    quote.unitPrice === undefined ||
                    !Number.isFinite(quote.unitPrice) ||
                    quote.unitPrice < 0
                ) {
                    throw new BadRequestException(
                        'Available medicine must have a valid unit price',
                    );
                }

                const unitPrice =
                    new Prisma.Decimal(
                        quote.unitPrice,
                    );

                const totalPrice =
                    unitPrice.mul(orderItem.quantity);

                await tx.orderItem.update({
                    where: { id: orderItem.id },
                    data: {
                        status: 'AVAILABLE',
                        unitPrice,
                        totalPrice,
                    },
                });
            }

            if (hasUnavailableItem) {
                await tx.order.update({
                    where: { id: order.id },
                    data: {
                        medicineSubtotal: null,
                        deliveryFee: null,
                        totalAmount: null,
                        pricingOriginPharmacyId: null,
                        pricingOriginLatitude: null,
                        pricingOriginLongitude: null,
                        pricingDistance: null,
                        pricingDistanceUnit: null,
                        pricingCalculatedAt: null,
                        pricingQuoteAt: null,
                        pricingSupported: null,
                        pricingConfigurationVersion: null,
                        pricingStrategy: null,
                        pricingConfigurationRef: null,
                    },
                });

                return this.getOrderForResponse(
                    tx,
                    order.id,
                );
            }

            const pharmacy =
                await tx.pharmacy.findUnique({
                    where: {
                        id: assignment.pharmacyId,
                    },
                    select: {
                        id: true,
                        latitude: true,
                        longitude: true,
                    },
                });

            if (!pharmacy) {
                throw new NotFoundException(
                    'Responsible pharmacy not found',
                );
            }

            const pricing =
                this.deliveryPricing.calculate({
                    originLatitude:
                        pharmacy.latitude,
                    originLongitude:
                        pharmacy.longitude,
                    destinationLatitude:
                        order.deliveryLatitude,
                    destinationLongitude:
                        order.deliveryLongitude,
                });

            if (!pricing.supported) {
                throw new BadRequestException(
                    'Delivery destination is outside the supported area',
                );
            }

            const pricedItems =
                await tx.orderItem.findMany({
                    where: {
                        orderId: order.id,
                    },
                    select: {
                        id: true,
                        totalPrice: true,
                    },
                });

            const medicineSubtotal =
                pricedItems.reduce(
                    (
                        total: Prisma.Decimal,
                        item,
                    ) =>
                        total.plus(
                            item.totalPrice ??
                                new Prisma.Decimal(0),
                        ),
                    new Prisma.Decimal(0),
                );

            const totalAmount =
                medicineSubtotal.plus(
                    pricing.deliveryFee,
                );

            await tx.order.update({
                where: { id: order.id },
                data: {
                    medicineSubtotal,
                    deliveryFee:
                        pricing.deliveryFee,
                    totalAmount,
                    currency: pricing.currency,
                    pricingConfigurationVersion:
                        pricing.pricingConfigurationVersion,
                    pricingStrategy:
                        pricing.pricingStrategy,
                    pricingConfigurationRef:
                        pricing.pricingConfigurationRef,
                    pricingOriginPharmacyId:
                        assignment.pharmacyId,
                    pricingOriginLatitude:
                        pharmacy.latitude,
                    pricingOriginLongitude:
                        pharmacy.longitude,
                    pricingDistance:
                        pricing.distance,
                    pricingDistanceUnit:
                        pricing.distanceUnit,
                    pricingCalculatedAt:
                        pricing.calculatedAt,
                    pricingQuoteAt:
                        pricing.calculatedAt,
                    pricingSupported: true,
                },
            });

            await this.orderState.transition(tx, {
                orderId: order.id,
                from: 'PHARMACY_REVIEWING',
                to: 'PHARMACY_CONFIRMED',
                actorUserId,
                reason: 'Pharmacy confirmed complete order and authoritative price',
            });

            await this.orderState.transition(tx, {
                orderId: order.id,
                from: 'PHARMACY_CONFIRMED',
                to: 'CUSTOMER_CONFIRMATION_PENDING',
                actorUserId,
                reason: 'Final price is available for customer confirmation',
            });

            return this.getOrderForResponse(
                tx,
                order.id,
            );
        });
    }

    async respondToPrice(
        orderId: string,
        customerId: string,
        decision: 'ACCEPT' | 'REJECT' | undefined,
    ) {
        if (!decision) {
            throw new BadRequestException(
                'Price decision is required',
            );
        }

        return this.prisma.$transaction(async (tx) => {
            const order =
                await tx.order.findUnique({
                    where: { id: orderId },
                    select: {
                        id: true,
                        customerId: true,
                        status: true,
                    },
                });

            if (!order) {
                throw new NotFoundException(
                    'Order not found',
                );
            }

            if (order.customerId !== customerId) {
                throw new BadRequestException(
                    'Order does not belong to the customer',
                );
            }

            if (
                order.status !==
                'CUSTOMER_CONFIRMATION_PENDING'
            ) {
                throw new ConflictException(
                    'Order is not awaiting customer price confirmation',
                );
            }

            const nextStatus =
                decision === 'ACCEPT'
                    ? 'PAYMENT_PENDING'
                    : 'CLOSED';

            await this.orderState.transition(tx, {
                orderId: order.id,
                from: 'CUSTOMER_CONFIRMATION_PENDING',
                to: nextStatus,
                actorUserId: customerId,
                reason:
                    decision === 'ACCEPT'
                        ? 'Customer accepted final price'
                        : 'Customer rejected final price',
            });

            return this.getOrderForResponse(
                tx,
                order.id,
            );
        });
    }

    private async getActiveAssignment(
        tx: Prisma.TransactionClient,
        orderId: string,
    ) {
        const assignment =
            await tx.pharmacyAssignment.findFirst({
                where: {
                    orderId,
                    status: 'ACTIVE',
                },
                select: {
                    id: true,
                    pharmacyId: true,
                },
            });

        if (!assignment) {
            throw new ConflictException(
                'Order has no active pharmacy assignment',
            );
        }

        return assignment;
    }

    private async requireActivePharmacyMembership(
        tx: Prisma.TransactionClient,
        pharmacyId: string,
        userId: string,
    ) {
        const membership =
            await tx.pharmacyMember.findFirst({
                where: {
                    pharmacyId,
                    userId,
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
    }

    private validateQuoteItems(
        orderItems: Array<{ id: string }>,
        quoteItems: PharmacyQuoteDto['items'],
    ) {
        if (
            !quoteItems ||
            quoteItems.length !== orderItems.length
        ) {
            throw new BadRequestException(
                'Every order item must be quoted exactly once',
            );
        }

        const orderItemIds = new Set(
            orderItems.map((item) => item.id),
        );
        const quotedIds = new Set<string>();

        for (const item of quoteItems) {
            if (quotedIds.has(item.orderItemId)) {
                throw new BadRequestException(
                    'Duplicate order item in pharmacy quote',
                );
            }

            if (!orderItemIds.has(item.orderItemId)) {
                throw new BadRequestException(
                    'Pharmacy quote contains an unknown order item',
                );
            }

            quotedIds.add(item.orderItemId);
        }
    }

    private async getOrderForResponse(
        tx: Prisma.TransactionClient,
        orderId: string,
    ) {
        const order =
            await tx.order.findUniqueOrThrow({
                where: { id: orderId },
                include: {
                    items: true,
                    assignments: {
                        orderBy: {
                            createdAt: 'asc',
                        },
                        select: {
                            id: true,
                            pharmacyId: true,
                            status: true,
                            offeredAt: true,
                            activatedAt: true,
                        },
                    },
                },
            });

        return this.toOrderResponse(order);
    }

    private toOrderResponse(order: any) {
        return {
            id: order.id,
            status: order.status,
            customerId: order.customerId,
            pharmacyId: order.pharmacyId,
            deliveryAddress: order.deliveryAddress,
            deliveryLatitude: order.deliveryLatitude,
            deliveryLongitude: order.deliveryLongitude,
            items: order.items,
            assignments: order.assignments,
            medicineSubtotal: order.medicineSubtotal,
            deliveryFee: order.deliveryFee,
            totalAmount: order.totalAmount,
            currency: order.currency,
            pricingConfigurationVersion:
                order.pricingConfigurationVersion,
            pricingStrategy: order.pricingStrategy,
            pricingConfigurationRef:
                order.pricingConfigurationRef,
            pricingOriginPharmacyId:
                order.pricingOriginPharmacyId,
            pricingOriginLatitude:
                order.pricingOriginLatitude,
            pricingOriginLongitude:
                order.pricingOriginLongitude,
            pricingDistance:
                order.pricingDistance,
            pricingDistanceUnit:
                order.pricingDistanceUnit,
            pricingCalculatedAt:
                order.pricingCalculatedAt,
            pricingQuoteAt:
                order.pricingQuoteAt,
            pricingSupported:
                order.pricingSupported,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
        };
    }
}
