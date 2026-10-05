/*
  Warnings:

  - You are about to drop the column `availabilityStatus` on the `Driver` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('PENDING_UPLOAD', 'UPLOADED', 'UNDER_REVIEW', 'ACCEPTED', 'REUPLOAD_REQUIRED');

-- DropIndex
DROP INDEX "Driver_approvalStatus_availabilityStatus_idx";

-- DropIndex
DROP INDEX "Driver_availabilityStatus_idx";

-- DropIndex
DROP INDEX "OtpChallenge_expiresAt_idx";

-- DropIndex
DROP INDEX "User_role_idx";

-- AlterTable
ALTER TABLE "Driver" DROP COLUMN "availabilityStatus",
ADD COLUMN     "availability" "DriverAvailabilityStatus" NOT NULL DEFAULT 'OFFLINE';

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'PENDING_UPLOAD',
    "reviewNote" TEXT,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionVersion" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrescriptionVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Prescription_orderId_key" ON "Prescription"("orderId");

-- CreateIndex
CREATE INDEX "Prescription_status_idx" ON "Prescription"("status");

-- CreateIndex
CREATE INDEX "Prescription_reviewedByUserId_idx" ON "Prescription"("reviewedByUserId");

-- CreateIndex
CREATE INDEX "PrescriptionVersion_prescriptionId_idx" ON "PrescriptionVersion"("prescriptionId");

-- CreateIndex
CREATE INDEX "PrescriptionVersion_uploadedByUserId_idx" ON "PrescriptionVersion"("uploadedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "PrescriptionVersion_prescriptionId_version_key" ON "PrescriptionVersion"("prescriptionId", "version");

-- CreateIndex
CREATE INDEX "Driver_availability_idx" ON "Driver"("availability");

-- CreateIndex
CREATE INDEX "Driver_approvalStatus_availability_idx" ON "Driver"("approvalStatus", "availability");

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionVersion" ADD CONSTRAINT "PrescriptionVersion_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionVersion" ADD CONSTRAINT "PrescriptionVersion_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
