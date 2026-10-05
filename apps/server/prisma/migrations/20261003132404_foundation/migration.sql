/*
  Warnings:

  - You are about to drop the column `pharmacistId` on the `Pharmacy` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Pharmacy` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PharmacyApprovalStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PharmacyOperationalStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "PharmacyMemberRole" AS ENUM ('OWNER', 'PHARMACIST');

-- CreateEnum
CREATE TYPE "PharmacyMemberStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "DriverApprovalStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "DriverAvailabilityStatus" AS ENUM ('OFFLINE', 'AVAILABLE', 'BUSY');

-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('HOME', 'WORK', 'OTHER');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'OWNER';

-- DropForeignKey
ALTER TABLE "Pharmacy" DROP CONSTRAINT "Pharmacy_pharmacistId_fkey";

-- DropIndex
DROP INDEX "Pharmacy_pharmacistId_key";

-- AlterTable
ALTER TABLE "Pharmacy" DROP COLUMN "pharmacistId",
DROP COLUMN "status",
ADD COLUMN     "approvalStatus" "PharmacyApprovalStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
ADD COLUMN     "operationalStatus" "PharmacyOperationalStatus" NOT NULL DEFAULT 'CLOSED';

-- DropEnum
DROP TYPE "PharmacyStatus";

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AddressType" NOT NULL DEFAULT 'HOME',
    "label" TEXT,
    "address" TEXT NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PharmacyMember" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "PharmacyMemberRole" NOT NULL,
    "status" "PharmacyMemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PharmacyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "approvalStatus" "DriverApprovalStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "availabilityStatus" "DriverAvailabilityStatus" NOT NULL DEFAULT 'OFFLINE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Address_userId_idx" ON "Address"("userId");

-- CreateIndex
CREATE INDEX "Address_userId_isDefault_idx" ON "Address"("userId", "isDefault");

-- CreateIndex
CREATE INDEX "PharmacyMember_pharmacyId_role_status_idx" ON "PharmacyMember"("pharmacyId", "role", "status");

-- CreateIndex
CREATE INDEX "PharmacyMember_userId_role_status_idx" ON "PharmacyMember"("userId", "role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PharmacyMember_pharmacyId_userId_key" ON "PharmacyMember"("pharmacyId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_userId_key" ON "Driver"("userId");

-- CreateIndex
CREATE INDEX "Driver_approvalStatus_idx" ON "Driver"("approvalStatus");

-- CreateIndex
CREATE INDEX "Driver_availabilityStatus_idx" ON "Driver"("availabilityStatus");

-- CreateIndex
CREATE INDEX "Driver_approvalStatus_availabilityStatus_idx" ON "Driver"("approvalStatus", "availabilityStatus");

-- CreateIndex
CREATE INDEX "Pharmacy_approvalStatus_idx" ON "Pharmacy"("approvalStatus");

-- CreateIndex
CREATE INDEX "Pharmacy_operationalStatus_idx" ON "Pharmacy"("operationalStatus");

-- CreateIndex
CREATE INDEX "Pharmacy_approvalStatus_operationalStatus_idx" ON "Pharmacy"("approvalStatus", "operationalStatus");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyMember" ADD CONSTRAINT "PharmacyMember_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyMember" ADD CONSTRAINT "PharmacyMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
