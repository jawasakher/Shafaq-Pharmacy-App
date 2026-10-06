CREATE TABLE "OrderStateHistory" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "previousState" "OrderStatus" NOT NULL,
    "newState" "OrderStatus" NOT NULL,
    "actorUserId" TEXT,
    "reason" TEXT,
    "requestId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStateHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrderStateHistory_orderId_createdAt_idx"
ON "OrderStateHistory" ("orderId", "createdAt");

CREATE INDEX "OrderStateHistory_actorUserId_createdAt_idx"
ON "OrderStateHistory" ("actorUserId", "createdAt");

CREATE INDEX "OrderStateHistory_newState_createdAt_idx"
ON "OrderStateHistory" ("newState", "createdAt");

ALTER TABLE "OrderStateHistory"
ADD CONSTRAINT "OrderStateHistory_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderStateHistory"
ADD CONSTRAINT "OrderStateHistory_actorUserId_fkey"
FOREIGN KEY ("actorUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
