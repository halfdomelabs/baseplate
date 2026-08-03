-- CreateTable
CREATE TABLE "notification_preference" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "scope_kind" TEXT NOT NULL,
    "scope_key" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_preference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_preference_user_id_scope_key_idx" ON "notification_preference"("user_id", "scope_key");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preference_user_id_scope_kind_scope_key_channe_key" ON "notification_preference"("user_id", "scope_kind", "scope_key", "channel");

-- AddForeignKey
ALTER TABLE "notification_preference" ADD CONSTRAINT "notification_preference_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE RESTRICT;
