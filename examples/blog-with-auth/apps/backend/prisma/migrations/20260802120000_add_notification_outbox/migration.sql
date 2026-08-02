-- DropIndex
DROP INDEX "notification_recipient_id_id_idx";

-- DropIndex
DROP INDEX "notification_recipient_id_read_at_idx";

-- AlterTable
ALTER TABLE "notification" ADD COLUMN     "dismissed_at" TIMESTAMPTZ(3),
ADD COLUMN     "in_app" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "request_id" UUID;

-- CreateTable
CREATE TABLE "notification_delivery" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "request_id" UUID NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notification_id" UUID NOT NULL,
    "delivered_at" TIMESTAMPTZ(3),

    CONSTRAINT "notification_delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_request" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "type" TEXT NOT NULL,
    "template_version" INTEGER NOT NULL DEFAULT 1,
    "params" JSONB,
    "idempotency_key" TEXT,
    "actor_kind" TEXT NOT NULL DEFAULT 'none',
    "actor_id" UUID,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "segments" JSONB NOT NULL,
    "fallback_text" TEXT NOT NULL,
    "action_url" TEXT,
    "fanout_status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "notification_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_delivery_status_created_at_idx" ON "notification_delivery"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_delivery_notification_id_channel_key" ON "notification_delivery"("notification_id", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "notification_request_idempotency_key_key" ON "notification_request"("idempotency_key");

-- CreateIndex
CREATE INDEX "notification_request_fanout_status_created_at_idx" ON "notification_request"("fanout_status", "created_at");

-- CreateIndex
CREATE INDEX "notification_recipient_id_in_app_seen_at_idx" ON "notification"("recipient_id", "in_app", "seen_at");

-- CreateIndex
CREATE INDEX "notification_recipient_id_in_app_id_idx" ON "notification"("recipient_id", "in_app", "id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_request_id_recipient_id_key" ON "notification"("request_id", "recipient_id");

-- AddForeignKey
ALTER TABLE "notification_delivery" ADD CONSTRAINT "notification_delivery_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notification"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

