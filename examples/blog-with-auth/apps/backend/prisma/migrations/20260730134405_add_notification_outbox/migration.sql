-- AlterTable
ALTER TABLE "notification" ADD COLUMN     "request_id" UUID;

-- CreateTable
CREATE TABLE "notification_delivery" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "request_id" UUID NOT NULL,
    "channel" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL DEFAULT 0,
    "recipient_ids" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

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

    CONSTRAINT "notification_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_delivery_status_created_at_idx" ON "notification_delivery"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_delivery_request_id_channel_chunk_index_key" ON "notification_delivery"("request_id", "channel", "chunk_index");

-- CreateIndex
CREATE UNIQUE INDEX "notification_request_idempotency_key_key" ON "notification_request"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "notification_request_id_recipient_id_key" ON "notification"("request_id", "recipient_id");

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "notification_request"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "notification_delivery" ADD CONSTRAINT "notification_delivery_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "notification_request"("id") ON DELETE CASCADE ON UPDATE RESTRICT;
