-- Only one pending transfer offer may exist for an order at a time.
CREATE UNIQUE INDEX "PharmacyAssignment_one_offered_per_order"
ON "PharmacyAssignment" ("orderId")
WHERE "status" = 'OFFERED';
