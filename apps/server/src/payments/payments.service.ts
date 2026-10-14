import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { OrderStateService } from '../orders/order-state.service.js';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderState: OrderStateService,
  ) {}

  async handleWebhook(payload: {
    eventId?: string;
    orderId?: string;
    transactionId?: string;
    status?: string;
    amount?: number;
    currency?: string;
  }) {
    if (!payload || !payload.orderId) {
      throw new BadRequestException('Invalid webhook payload: missing orderId');
    }

    const {
      eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      orderId,
      transactionId = `txn_${Date.now()}`,
      status = 'PAID',
    } = payload;

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: { id: true, status: true },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      let payment = await tx.payment.findFirst({
        where: { orderId },
      });

      if (!payment) {
        payment = await tx.payment.create({
          data: {
            orderId,
            provider: 'SHAM_CASH',
            idempotencyKey: eventId,
            amount: payload.amount || 0,
            currency: payload.currency || 'SYP',
            status: 'PENDING',
          },
        });
      }

      const existingEvent = await tx.paymentEvent.findUnique({
        where: { providerEventId: eventId },
      });

      if (!existingEvent) {
        await tx.paymentEvent.create({
          data: {
            paymentId: payment.id,
            providerEventId: eventId,
            eventType: status === 'PAID' ? 'payment.success' : 'payment.failed',
            payload: payload as any,
          },
        });
      }

      if (status === 'PAID') {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'PAID',
            providerTransactionId: transactionId,
            paidAt: new Date(),
          },
        });

        if (order.status === 'PAYMENT_PENDING') {
          await this.orderState.transition(tx, {
            orderId: order.id,
            from: 'PAYMENT_PENDING',
            to: 'PAID',
            reason: `Payment verified via webhook transaction ${transactionId}`,
          });
        }
      } else {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
            providerTransactionId: transactionId,
          },
        });
      }

      return {
        success: true,
        orderId,
        paymentStatus: status === 'PAID' ? 'PAID' : 'FAILED',
      };
    });
  }
}
