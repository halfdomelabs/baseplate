-- Notifications v5, part 3: the delta anchor index.
--
-- Answers the question an outbound send asks before rendering: when was this
-- row last delivered on this channel? That timestamp is the boundary a batched
-- type measures its delta from.
--
-- The equality columns lead and `delivered_at` is the ordered tail, so the
-- per-chunk MAX(delivered_at) aggregate reads straight off the index. `status`
-- is in the key because only `delivered` rows count: an abandoned delivery is
-- `skipped` and never sets `delivered_at`, so an outage widens the next delta
-- rather than swallowing it.

-- CreateIndex
CREATE INDEX "notification_delivery_notification_id_channel_status_delive_idx" ON "notification_delivery"("notification_id", "channel", "status", "delivered_at");
