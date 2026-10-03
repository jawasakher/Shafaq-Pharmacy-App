-- Identity foundation: customer OTP challenges and revocable sessions.

CREATE TYPE "SessionType" AS ENUM ('CUSTOMER', 'INTERNAL');

CREATE TABLE "OtpChallenge" (
  "id" TEXT NOT NULL,
  "phoneHash" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OtpChallenge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuthSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "SessionType" NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AuthSession_tokenHash_key"
ON "AuthSession"("tokenHash");

CREATE INDEX "OtpChallenge_phoneHash_createdAt_idx"
ON "OtpChallenge"("phoneHash", "createdAt");

CREATE INDEX "OtpChallenge_expiresAt_idx"
ON "OtpChallenge"("expiresAt");

CREATE INDEX "AuthSession_userId_type_idx"
ON "AuthSession"("userId", "type");

CREATE INDEX "AuthSession_expiresAt_idx"
ON "AuthSession"("expiresAt");

CREATE INDEX "AuthSession_revokedAt_idx"
ON "AuthSession"("revokedAt");

ALTER TABLE "AuthSession"
ADD CONSTRAINT "AuthSession_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
