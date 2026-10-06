-- The same pharmacy may not receive duplicate pending offers for an order.
CREATE UNIQUE INDEX "PharmacyAssignment_one_offered_per_order_pharmacy"
ON "PharmacyAssignment" ("orderId", "pharmacyId")
WHERE "status" = 'OFFERED';
