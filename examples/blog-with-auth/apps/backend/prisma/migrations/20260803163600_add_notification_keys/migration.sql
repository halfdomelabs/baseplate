-- Keyed notifications: one row per (recipient, fact), replaced in place.
--
-- `key` and `feed_order_id` are both NOT NULL with no usable literal default,
-- so each is added nullable, backfilled, then constrained.

-- DropIndex
-- Superseded by the feed_order_id index below: the feed now sorts by the
-- reissued key so a replaced row resurfaces.
DROP INDEX "notification_recipient_id_in_app_id_idx";

-- DropIndex
-- Superseded by the three-column unique below, which adds the generation.
DROP INDEX "notification_delivery_notification_id_channel_key";

-- AlterTable
-- feed_order_id carries a DB-side default, so existing rows get a distinct
-- value each (uuidv7() is VOLATILE, so the table rewrite evaluates it per row).
ALTER TABLE "notification" ADD COLUMN "feed_order_id" UUID NOT NULL DEFAULT uuidv7();

-- AlterTable
-- key has no default. Existing rows predate keying and are unkeyed facts, so
-- they take the same generated form the write path mints for a caller who
-- supplies none — unique per row, and never matched by a caller's own key.
ALTER TABLE "notification" ADD COLUMN "key" TEXT;
UPDATE "notification" SET "key" = 'request:' || "id"::text WHERE "key" IS NULL;
ALTER TABLE "notification" ALTER COLUMN "key" SET NOT NULL;

-- AlterTable
-- The delivery's generation is a COPY of its parent's at arm time, not an
-- independent id: existing deliveries belong to their row's current
-- generation, which is what makes the unique below mean what it says.
ALTER TABLE "notification_delivery" ADD COLUMN "feed_order_id" UUID;
UPDATE "notification_delivery" d
SET "feed_order_id" = n."feed_order_id"
FROM "notification" n
WHERE d."notification_id" = n."id" AND d."feed_order_id" IS NULL;
ALTER TABLE "notification_delivery" ALTER COLUMN "feed_order_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "notification_feed_order_id_key" ON "notification"("feed_order_id");

-- CreateIndex
CREATE INDEX "notification_recipient_id_in_app_feed_order_id_idx" ON "notification"("recipient_id", "in_app", "feed_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_recipient_id_key_key" ON "notification"("recipient_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "notification_delivery_notification_id_channel_feed_order_id_key" ON "notification_delivery"("notification_id", "channel", "feed_order_id");
