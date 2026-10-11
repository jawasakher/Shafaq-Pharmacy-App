import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateLocationDto } from './dto/update-location.dto.js';

@Injectable()
export class DeliveryService {
  constructor(private readonly prisma: PrismaService) {}

  private async requireApprovedDriver(userId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver || driver.approvalStatus !== 'APPROVED') {
      throw new ForbiddenException('Driver account is not approved');
    }

    return driver;
  }

  async updateDriverLocation(userId: string, dto: UpdateLocationDto) {
    const driver = await this.requireApprovedDriver(userId);

    const currentLocation = await this.prisma.driverCurrentLocation.upsert({
      where: { driverId: driver.id },
      create: {
        driverId: driver.id,
        latitude: dto.latitude,
        longitude: dto.longitude,
        heading: dto.heading,
        speed: dto.speed,
      },
      update: {
        latitude: dto.latitude,
        longitude: dto.longitude,
        heading: dto.heading,
        speed: dto.speed,
        recordedAt: new Date(),
      },
    });

    await this.prisma.driverLocationHistory.create({
      data: {
        driverId: driver.id,
        latitude: dto.latitude,
        longitude: dto.longitude,
        heading: dto.heading,
        speed: dto.speed,
      },
    });

    return currentLocation;
  }

  async toggleAvailability(userId: string, availability: 'OFFLINE' | 'AVAILABLE' | 'BUSY') {
    const driver = await this.requireApprovedDriver(userId);

    return this.prisma.driver.update({
      where: { id: driver.id },
      data: { availability },
      select: {
        id: true,
        approvalStatus: true,
        availability: true,
      },
    });
  }

  async listDeliveryOffers(userId: string) {
    const driver = await this.requireApprovedDriver(userId);

    return this.prisma.deliveryOffer.findMany({
      where: {
        driverId: driver.id,
        status: 'OFFERED',
      },
      include: {
        delivery: {
          include: {
            order: {
              select: {
                id: true,
                totalAmount: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async acceptDeliveryOffer(userId: string, offerId: string) {
    const driver = await this.requireApprovedDriver(userId);

    const offer = await this.prisma.deliveryOffer.findFirst({
      where: { id: offerId, driverId: driver.id },
      include: { delivery: true },
    });

    if (!offer) {
      throw new NotFoundException('Delivery offer not found');
    }

    if (offer.status !== 'OFFERED') {
      throw new ConflictException('Delivery offer is no longer available');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.deliveryOffer.update({
        where: { id: offer.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });

      const updatedDelivery = await tx.delivery.update({
        where: { id: offer.deliveryId },
        data: {
          driverId: driver.id,
          status: 'DRIVER_ASSIGNED',
        },
      });

      await tx.driver.update({
        where: { id: driver.id },
        data: { availability: 'BUSY' },
      });

      return updatedDelivery;
    });
  }

  async pickupDelivery(userId: string, deliveryId: string) {
    const driver = await this.requireApprovedDriver(userId);

    const delivery = await this.prisma.delivery.findFirst({
      where: { id: deliveryId, driverId: driver.id },
    });

    if (!delivery) {
      throw new NotFoundException('Active delivery not found');
    }

    if (
      delivery.status !== 'DRIVER_ASSIGNED' &&
      delivery.status !== 'GOING_TO_PHARMACY' &&
      delivery.status !== 'ARRIVED_AT_PHARMACY'
    ) {
      throw new BadRequestException('Delivery is not in a pickable state');
    }

    return this.prisma.delivery.update({
      where: { id: delivery.id },
      data: {
        status: 'PICKED_UP',
        pickedUpAt: new Date(),
      },
    });
  }

  async completeDelivery(userId: string, deliveryId: string) {
    const driver = await this.requireApprovedDriver(userId);

    const delivery = await this.prisma.delivery.findFirst({
      where: { id: deliveryId, driverId: driver.id },
    });

    if (!delivery) {
      throw new NotFoundException('Active delivery not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const completed = await tx.delivery.update({
        where: { id: delivery.id },
        data: {
          status: 'DELIVERED',
          deliveredAt: new Date(),
          completedAt: new Date(),
        },
      });

      await tx.order.update({
        where: { id: delivery.orderId },
        data: { status: 'DELIVERED' },
      });

      await tx.driver.update({
        where: { id: driver.id },
        data: { availability: 'AVAILABLE' },
      });

      return completed;
    });
  }
}
