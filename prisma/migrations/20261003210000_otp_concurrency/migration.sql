ALTER TABLE "OtpChallenge" ADD COLUMN "activeKey" TEXT;

CREATE UNIQUE INDEX "OtpChallenge_activeKey_key" ON "OtpChallenge"("activeKey");
