-- Only one pharmacy assignment may be active for an order at a time.
CREATE UNIQUE INDEX "PharmacyAssignment_one_active_per_order"
ON "PharmacyAssignment" ("orderId")
WHERE "status" = 'ACTIVE';