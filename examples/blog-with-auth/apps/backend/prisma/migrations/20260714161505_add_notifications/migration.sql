-- CreateTable
CREATE TABLE "notification" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "type" TEXT NOT NULL,
    "template_version" INTEGER NOT NULL DEFAULT 1,
    "recipient_id" UUID NOT NULL,
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

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_recipient_id_read_at_idx" ON "notification"("recipient_id", "read_at");

-- CreateIndex
CREATE INDEX "notification_recipient_id_created_at_idx" ON "notification"("recipient_id", "created_at");

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE RESTRICT;
