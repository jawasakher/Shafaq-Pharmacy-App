import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardMetrics() {
    const [usersByRole, ordersByStatus, driversByAvailability, pharmaciesByApproval, consultationsByStatus] =
      await Promise.all([
        this.prisma.user.groupBy({
          by: ['role'],
          _count: { id: true },
        }),
        this.prisma.order.groupBy({
          by: ['status'],
          _count: { id: true },
        }),
        this.prisma.driver.groupBy({
          by: ['availability'],
          _count: { id: true },
        }),
        this.prisma.pharmacy.groupBy({
          by: ['approvalStatus'],
          _count: { id: true },
        }),
        this.prisma.consultation.groupBy({
          by: ['status'],
          _count: { id: true },
        }),
      ]);

    return {
      usersByRole: Object.fromEntries(usersByRole.map((u) => [u.role, u._count.id])),
      ordersByStatus: Object.fromEntries(ordersByStatus.map((o) => [o.status, o._count.id])),
      driversByAvailability: Object.fromEntries(driversByAvailability.map((d) => [d.availability, d._count.id])),
      pharmaciesByApproval: Object.fromEntries(pharmaciesByApproval.map((p) => [p.approvalStatus, p._count.id])),
      consultationsByStatus: Object.fromEntries(consultationsByStatus.map((c) => [c.status, c._count.id])),
    };
  }

  async getAuditLogs(page: number = 1, limit: number = 20) {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const skip = (Math.max(page, 1) - 1) * safeLimit;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          createdAt: true,
          actor: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.auditLog.count(),
    ]);

    return {
      items,
      pagination: {
        page,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async getTransfers(page: number = 1, limit: number = 20) {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const skip = (Math.max(page, 1) - 1) * safeLimit;

    const [items, total] = await Promise.all([
      this.prisma.pharmacyAssignment.findMany({
        select: {
          id: true,
          orderId: true,
          pharmacyId: true,
          status: true,
          offeredAt: true,
          activatedAt: true,
          transferredAt: true,
          rejectedAt: true,
          expiredAt: true,
          pharmacy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.pharmacyAssignment.count(),
    ]);

    return {
      items,
      pagination: {
        page,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async getDeliveries(page: number = 1, limit: number = 20) {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const skip = (Math.max(page, 1) - 1) * safeLimit;

    const [items, total] = await Promise.all([
      this.prisma.delivery.findMany({
        select: {
          id: true,
          orderId: true,
          driverId: true,
          status: true,
          startedAt: true,
          pickedUpAt: true,
          deliveredAt: true,
          completedAt: true,
          createdAt: true,
          updatedAt: true,
          driver: {
            select: {
              id: true,
              availability: true,
              currentLocation: {
                select: {
                  recordedAt: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.delivery.count(),
    ]);

    return {
      items,
      pagination: {
        page,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async getConsultations(page: number = 1, limit: number = 20) {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const skip = (Math.max(page, 1) - 1) * safeLimit;

    const [items, total] = await Promise.all([
      this.prisma.consultation.findMany({
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          pharmacistId: true,
          pharmacyId: true,
          pharmacist: {
            select: {
              id: true,
              name: true,
            },
          },
          pharmacy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.consultation.count(),
    ]);

    return {
      items,
      pagination: {
        page,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }
}
