-- Notifications v5, part 2: content shape and actor removal.
--
-- The four content columns collapse into one nullable `frozen_content` blob.
-- Nothing renders from it: the feed re-renders live from `params` against the
-- version-pinned renderer, and this is only the recovery copy read when that
-- renderer is gone or its params no longer validate. Four columns implied
-- queryable structure that nothing ever queried.
--
-- It holds plain strings, not segments. A fallback needs to be legible rather
-- than formatted, and a flat string never needs converting again when the
-- segment vocabulary changes — as it just did in this very migration.
-- `fallback_text` already stored exactly this flattening, so the v4 rows below
-- carry over verbatim.
--
-- Actor columns go entirely. Actor identity now travels in `params`, typed by
-- each type's own `paramsSchema`, so names render from one source on every
-- channel instead of a live join racing a stored label.

-- Notification: fold the content columns into one.
ALTER TABLE "notification" ADD COLUMN "frozen_content" JSONB;

UPDATE "notification"
SET "frozen_content" = jsonb_strip_nulls(
  jsonb_build_object(
    'title', "fallback_text",
    'actionUrl', "action_url"
  )
);

ALTER TABLE "notification" DROP COLUMN "segments";
ALTER TABLE "notification" DROP COLUMN "fallback_text";
ALTER TABLE "notification" DROP COLUMN "action_url";

-- Notification: actor columns and the FK to "user".
ALTER TABLE "notification" DROP CONSTRAINT "notification_actor_id_fkey";
ALTER TABLE "notification" DROP COLUMN "actor_kind";
ALTER TABLE "notification" DROP COLUMN "actor_id";
ALTER TABLE "notification" DROP COLUMN "actor_label";
ALTER TABLE "notification" DROP COLUMN "system_actor_key";

-- NotificationRequest: the same content and actor changes.
ALTER TABLE "notification_request" ADD COLUMN "frozen_content" JSONB;

UPDATE "notification_request"
SET "frozen_content" = jsonb_strip_nulls(
  jsonb_build_object(
    'title', "fallback_text",
    'actionUrl', "action_url"
  )
);

ALTER TABLE "notification_request" DROP COLUMN "segments";
ALTER TABLE "notification_request" DROP COLUMN "fallback_text";
ALTER TABLE "notification_request" DROP COLUMN "action_url";
ALTER TABLE "notification_request" DROP COLUMN "actor_kind";
ALTER TABLE "notification_request" DROP COLUMN "actor_id";
