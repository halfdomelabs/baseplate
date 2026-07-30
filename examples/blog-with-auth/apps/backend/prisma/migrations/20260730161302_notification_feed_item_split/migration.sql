-- DropForeignKey
ALTER TABLE "notification" DROP CONSTRAINT "notification_actor_id_fkey";

-- DropForeignKey
ALTER TABLE "notification" DROP CONSTRAINT "notification_recipient_id_fkey";

-- DropForeignKey
ALTER TABLE "notification" DROP CONSTRAINT "notification_request_id_fkey";

-- AlterTable
ALTER TABLE "notification_request" ADD COLUMN     "action_url" TEXT,
ADD COLUMN     "fallback_text" TEXT NOT NULL,
ADD COLUMN     "segments" JSONB NOT NULL;

-- DropTable
DROP TABLE "notification";

-- CreateTable
CREATE TABLE "notification_feed_item" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "type" TEXT NOT NULL,
    "template_version" INTEGER NOT NULL DEFAULT 1,
    "recipient_id" UUID NOT NULL,
    "request_id" UUID,
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
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_feed_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_feed_item_recipient_id_read_at_idx" ON "notification_feed_item"("recipient_id", "read_at");

-- CreateIndex
CREATE INDEX "notification_feed_item_recipient_id_id_idx" ON "notification_feed_item"("recipient_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_feed_item_request_id_recipient_id_key" ON "notification_feed_item"("request_id", "recipient_id");

-- AddForeignKey
ALTER TABLE "notification_feed_item" ADD CONSTRAINT "notification_feed_item_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "notification_feed_item" ADD CONSTRAINT "notification_feed_item_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE RESTRICT;
