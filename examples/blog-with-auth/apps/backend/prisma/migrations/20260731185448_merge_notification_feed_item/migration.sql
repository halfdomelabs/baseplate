-- DropForeignKey
ALTER TABLE "notification_delivery" DROP CONSTRAINT "notification_delivery_request_id_fkey";

-- DropForeignKey
ALTER TABLE "notification_feed_item" DROP CONSTRAINT "notification_feed_item_actor_id_fkey";

-- DropForeignKey
ALTER TABLE "notification_feed_item" DROP CONSTRAINT "notification_feed_item_recipient_id_fkey";

-- DropIndex
DROP INDEX "notification_delivery_request_id_channel_chunk_index_key";

-- AlterTable
ALTER TABLE "notification_delivery" DROP COLUMN "chunk_index",
DROP COLUMN "recipient_ids",
ADD COLUMN     "notification_id" UUID NOT NULL;

-- DropTable
DROP TABLE "notification_feed_item";

-- CreateTable
CREATE TABLE "notification" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "type" TEXT NOT NULL,
    "template_version" INTEGER NOT NULL DEFAULT 1,
    "recipient_id" UUID NOT NULL,
    "request_id" UUID,
    "in_app" BOOLEAN NOT NULL DEFAULT false,
    "segments" JSONB NOT NULL,
    "fallback_text" TEXT NOT NULL,
    "params" JSONB,
    "actor_kind" TEXT NOT NULL DEFAULT 'none',
    "actor_id" UUID,
    "actor_label" TEXT,
    "system_actor_key" TEXT,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "action_url" TEXT,
    "seen_at" TIMESTAMPTZ(3),
    "read_at" TIMESTAMPTZ(3),
    "dismissed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_recipient_id_in_app_seen_at_idx" ON "notification"("recipient_id", "in_app", "seen_at");

-- CreateIndex
CREATE INDEX "notification_recipient_id_in_app_id_idx" ON "notification"("recipient_id", "in_app", "id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_request_id_recipient_id_key" ON "notification"("request_id", "recipient_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_delivery_notification_id_channel_key" ON "notification_delivery"("notification_id", "channel");

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "notification_delivery" ADD CONSTRAINT "notification_delivery_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notification"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

