/*
  Notifications design spec v5.

  Three changes land together because none of them compiles without the others:
  the renames that fix wrong names, topics replacing the two preference scopes,
  and dropping the columns those scopes needed.
*/

-- --- Preferences: topics replace categories ---
-- Rows are DELETED rather than migrated. v4 carried both category-scoped and
-- type-scoped rows, and neither has an honest target under a single scope: a
-- type row has no topic to belong to, and a category row cannot say which of
-- the new per-channel modes the user meant. Preferences are sparse overrides,
-- so an empty table returns every user to the Builder topic defaults — which
-- is a defensible state, not a broken one.
DELETE FROM "notification_preference";

DROP INDEX "notification_preference_user_id_scope_key_idx";
-- DROP INDEX, not DROP CONSTRAINT: Prisma emits its uniques as unique indexes.
-- Note also the truncated name — Postgres caps identifiers at 63 characters, so
-- the index lost the final "l" of "channel".
DROP INDEX "notification_preference_user_id_scope_kind_scope_key_channe_key";

ALTER TABLE "notification_preference" DROP COLUMN "scope_kind";
ALTER TABLE "notification_preference" RENAME COLUMN "scope_key" TO "topic_key";
-- `enabled` becomes a three-valued mode. Dropped and re-added rather than cast:
-- the table is empty, so there is nothing to preserve.
ALTER TABLE "notification_preference" DROP COLUMN "enabled";
ALTER TABLE "notification_preference" ADD COLUMN "mode" TEXT NOT NULL;
-- Nullable: absent means "inherit the topic's window", so a user who has only
-- chosen `digest` does not get their window frozen at whatever the Builder
-- default happened to be that day.
ALTER TABLE "notification_preference" ADD COLUMN "digest_window_seconds" INTEGER;

CREATE UNIQUE INDEX "notification_preference_user_id_topic_key_channel_key" ON "notification_preference"("user_id", "topic_key", "channel");
CREATE INDEX "notification_preference_user_id_topic_key_idx" ON "notification_preference"("user_id", "topic_key");

-- --- Notification: renames, and the load-bearing unique ---
-- Renames, so the backfilled ordering and the existing collapse keys are
-- preserved: `feed_order_id` read as identity rather than ordering, and `key`
-- said nothing about what it grouped.
ALTER TABLE "notification" RENAME COLUMN "feed_order_id" TO "feed_sort_key";
ALTER TABLE "notification" RENAME COLUMN "key" TO "group_key";

-- The entity columns are gone: `group_key` is the retraction target, so a
-- polymorphic subject reference no longer identifies anything the write path
-- or the read path uses.
ALTER TABLE "notification" DROP COLUMN "entity_type";
ALTER TABLE "notification" DROP COLUMN "entity_id";

DROP INDEX "notification_recipient_id_key_key";
-- THE COLUMN ORDER IS LOAD-BEARING. `group_key` is recipient-independent, so
-- leading with (type, group_key) makes "every recipient holding this fact" an
-- indexed prefix scan — which is what lets a bulk retraction find the whole
-- audience of a withdrawn fact without entity columns to look it up by.
-- Ordering it (recipient_id, type, group_key) would serve the single-row
-- upsert equally well but force a full scan for that audience query.
CREATE UNIQUE INDEX "notification_type_group_key_recipient_id_key" ON "notification"("type", "group_key", "recipient_id");

DROP INDEX "notification_recipient_id_in_app_feed_order_id_idx";
CREATE INDEX "notification_recipient_id_in_app_feed_sort_key_idx" ON "notification"("recipient_id", "in_app", "feed_sort_key");

ALTER INDEX "notification_feed_order_id_key" RENAME TO "notification_feed_sort_key_key";

-- --- Request: no dedupe key of its own ---
-- Row-level upsert on `group_key` is the idempotency boundary now, so a request
-- is always a fresh dispatch record and a replay collapses at the notification
-- instead. Its entity columns go for the same reason the notification's did.
DROP INDEX "notification_request_idempotency_key_key";
ALTER TABLE "notification_request" DROP COLUMN "idempotency_key";
ALTER TABLE "notification_request" DROP COLUMN "entity_type";
ALTER TABLE "notification_request" DROP COLUMN "entity_id";

-- --- Delivery: carries the renamed generation key ---
ALTER TABLE "notification_delivery" RENAME COLUMN "feed_order_id" TO "feed_sort_key";
DROP INDEX "notification_delivery_notification_id_channel_feed_order_id_key";
CREATE UNIQUE INDEX "notification_delivery_notification_id_channel_feed_sort_key_key" ON "notification_delivery"("notification_id", "channel", "feed_sort_key");
