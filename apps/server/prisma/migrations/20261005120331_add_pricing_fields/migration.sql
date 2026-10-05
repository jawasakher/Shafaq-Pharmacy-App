/*
  Warnings:

  - You are about to drop the column `isDefault` on the `Address` table. All the data in the column will be lost.
  - You are about to drop the column `reviewNote` on the `Prescription` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedAt` on the `Prescription` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedByUserId` on the `Prescription` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Prescription" DROP CONSTRAINT "Prescription_reviewedByUserId_fkey";

-- DropIndex
DROP INDEX "Address_userId_isDefault_idx";

-- DropIndex
DROP INDEX "Prescription_reviewedByUserId_idx";

-- AlterTable
ALTER TABLE "Address" DROP COLUMN "isDefault",
ALTER COLUMN "type" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "currency" VARCHAR(3) NOT NULL DEFAULT 'SYP',
ADD COLUMN     "deliveryFee" DECIMAL(12,2),
ADD COLUMN     "pricingCalculatedAt" TIMESTAMP(3),
ADD COLUMN     "pricingConfigurationRef" TEXT,
ADD COLUMN     "pricingConfigurationVersion" TEXT,
ADD COLUMN     "pricingDistance" DECIMAL(65,30),
ADD COLUMN     "pricingDistanceUnit" TEXT,
ADD COLUMN     "pricingOriginLatitude" DECIMAL(10,7),
ADD COLUMN     "pricingOriginLongitude" DECIMAL(10,7),
ADD COLUMN     "pricingOriginPharmacyId" TEXT,
ADD COLUMN     "pricingQuoteAt" TIMESTAMP(3),
ADD COLUMN     "pricingStrategy" TEXT,
ADD COLUMN     "pricingSupported" BOOLEAN,
ADD COLUMN     "totalAmount" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "Prescription" DROP COLUMN "reviewNote",
DROP COLUMN "reviewedAt",
DROP COLUMN "reviewedByUserId";

-- AlterTable
ALTER TABLE "PrescriptionVersion" ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "reviewNotes" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedByUserId" TEXT,
ADD COLUMN     "status" "PrescriptionStatus" NOT NULL DEFAULT 'UPLOADED';

-- CreateIndex
CREATE INDEX "OtpChallenge_expiresAt_idx" ON "OtpChallenge"("expiresAt");

-- CreateIndex
CREATE INDEX "PrescriptionVersion_reviewedByUserId_idx" ON "PrescriptionVersion"("reviewedByUserId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_pricingOriginPharmacyId_fkey" FOREIGN KEY ("pricingOriginPharmacyId") REFERENCES "Pharmacy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionVersion" ADD CONSTRAINT "PrescriptionVersion_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
