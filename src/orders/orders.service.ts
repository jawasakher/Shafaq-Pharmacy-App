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

        const order = await this.prisma.order.create({
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
            },
        });

        return {
            id: order.id,
            status: order.status,
            pharmacy: order.pharmacy,
            deliveryAddress: order.deliveryAddress,
            deliveryLatitude: order.deliveryLatitude,
            deliveryLongitude: order.deliveryLongitude,
            items: order.items,
            medicineSubtotal: order.medicineSubtotal,
            createdAt: order.createdAt,
        };
    }
}