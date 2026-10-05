-- Foundation integrity constraints required by SRS v1.2.
-- These rules belong in the database in addition to service-level authorization.

-- Only one ACTIVE owner may exist for a pharmacy.
CREATE UNIQUE INDEX "PharmacyMember_one_active_owner_per_pharmacy"
ON "PharmacyMember" ("pharmacyId")
WHERE "role" = 'OWNER' AND "status" = 'ACTIVE';

-- An approved pharmacy is required before it can be OPEN.
ALTER TABLE "Pharmacy"
ADD CONSTRAINT "Pharmacy_open_requires_approval"
CHECK (
  "operationalStatus" = 'CLOSED'
  OR "approvalStatus" = 'APPROVED'
);
