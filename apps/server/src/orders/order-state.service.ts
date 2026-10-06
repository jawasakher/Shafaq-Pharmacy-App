import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma, OrderStatus } from '@prisma/client';

@Injectable()
export class OrderStateService {
    async transition(
        tx: Prisma.TransactionClient,
        input: {
            orderId: string;
            from: OrderStatus;
            to: OrderStatus;
            actorUserId?: string;
            reason?: string;
            requestId?: string;
            metadata?: Prisma.InputJsonValue;
        },
    ) {
        const updated = await tx.order.updateMany({
            where: {
                id: input.orderId,
                status: input.from,
            },
            data: {
                status: input.to,
            },
        });

        if (updated.count !== 1) {
            throw new ConflictException(
                `Order cannot transition from ${input.from} to ${input.to}`,
            );
        }

        await tx.orderStateHistory.create({
            data: {
                orderId: input.orderId,
                previousState: input.from,
                newState: input.to,
                actorUserId: input.actorUserId,
                reason: input.reason,
                requestId: input.requestId,
                metadata: input.metadata,
            },
        });
    }
    async transitionToNoPharmacyAvailable(
        tx: Prisma.TransactionClient,
        input: {
            orderId: string;
            actorUserId?: string;
            reason?: string;
            requestId?: string;
            metadata?: Prisma.InputJsonValue;
        },
    ) {
        return this.transition(tx, {
            orderId: input.orderId,
            from: 'PHARMACY_REVIEWING',
            to: 'NO_PHARMACY_AVAILABLE',
            actorUserId: input.actorUserId,
            reason: input.reason,
            requestId: input.requestId,
            metadata: input.metadata,
        });
    }

}
