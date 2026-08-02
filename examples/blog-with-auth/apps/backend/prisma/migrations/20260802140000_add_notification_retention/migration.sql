-- AlterTable
ALTER TABLE "notification" ADD COLUMN     "expires_at" TIMESTAMPTZ(3);

-- CreateIndex
CREATE INDEX "notification_expires_at_idx" ON "notification"("expires_at");
