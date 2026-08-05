-- Notification digests: the delivery row learns how it should be sent.
--
-- `mode` records the routing decision the service already made but discarded,
-- so the outbox can tell a digest row from an immediate one. Defaulted rather
-- than nullable: rows written before this migration were all immediate, which
-- is exactly what the default says about them.
--
-- `digest_due_at` is when a row becomes due for a digest send, set on insert
-- and never updated. Null for immediate rows. It is a floor, not a promise:
-- the scan runs on a schedule, and once a pair's oldest row comes due the send
-- drains every pending digest row for that pair — so newer rows go out before
-- their own due time.
--
-- `recipient_id` is denormalized from `notification` so the digest scan can
-- group and settle by (recipient, channel) without a join. Safe because the
-- column is immutable on `notification`, and left FK-less for the same reason
-- `request_id` is: user -> notification -> delivery already cascades.

-- AlterTable
ALTER TABLE "notification_delivery"
  ADD COLUMN "mode" TEXT NOT NULL DEFAULT 'immediate',
  ADD COLUMN "digest_due_at" TIMESTAMPTZ(3),
  ADD COLUMN "recipient_id" UUID;

-- Backfill the recipient from the parent notification before the column is
-- made NOT NULL. Existing rows are all immediate, so nothing needs a due time.
UPDATE "notification_delivery" AS d
SET "recipient_id" = n."recipient_id"
FROM "notification" AS n
WHERE d."notification_id" = n."id";

-- Any row whose notification vanished mid-migration has nothing to deliver to;
-- deleting it is what the cascade would have done.
DELETE FROM "notification_delivery" WHERE "recipient_id" IS NULL;

ALTER TABLE "notification_delivery"
  ALTER COLUMN "recipient_id" SET NOT NULL;

-- CreateIndex
-- The digest scan: pending digest rows whose window has closed, ordered by due
-- time. Equality on status/mode leads, with `digest_due_at` as the range tail.
CREATE INDEX "notification_delivery_status_mode_digest_due_at_idx" ON "notification_delivery"("status", "mode", "digest_due_at");

-- CreateIndex
-- The per-pair claim: every pending digest row for one (recipient, channel).
-- All four columns are equality predicates, so this is a prefix seek.
CREATE INDEX "notification_delivery_recipient_id_channel_status_mode_idx" ON "notification_delivery"("recipient_id", "channel", "status", "mode");
