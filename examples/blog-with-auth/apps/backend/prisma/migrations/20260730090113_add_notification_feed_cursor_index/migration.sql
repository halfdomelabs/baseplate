-- DropIndex
DROP INDEX "notification_recipient_id_created_at_idx";

-- CreateIndex
CREATE INDEX "notification_recipient_id_id_idx" ON "notification"("recipient_id", "id");
