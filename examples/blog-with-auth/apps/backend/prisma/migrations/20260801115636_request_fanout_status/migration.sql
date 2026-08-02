-- AlterTable
ALTER TABLE "notification_request" ADD COLUMN     "fanout_status" TEXT NOT NULL DEFAULT 'pending';

-- CreateIndex
CREATE INDEX "notification_request_fanout_status_created_at_idx" ON "notification_request"("fanout_status", "created_at");

