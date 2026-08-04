import type { PartialProjectDefinitionInput } from '@baseplate-dev/project-builder-lib';

import { FeatureUtils } from '@baseplate-dev/project-builder-lib';

import { NOTIFICATION_MODELS } from '#src/notifications/constants/model-names.js';

/**
 * Builds the partial project definition contributed by the notifications plugin.
 *
 * `Notification` is the DURABLE per-recipient record, written for every channel
 * — not just in-app. `inApp` is a routing outcome stamped at fan-out, so the
 * feed is a filter over this table rather than a table of its own; the row also
 * gives a future digest somewhere to accumulate aggregation state, which an
 * in-app-only table could not do for an email-only type.
 * `NotificationRequest` is TRANSIENT dispatch state, and `NotificationDelivery`
 * is per-recipient, per-channel delivery state. `NotificationPreference` holds
 * sparse per-user overrides on the Builder-declared topic defaults.
 *
 * Render-at-read content model: `params` (render inputs) are the source of truth,
 * re-rendered per request; `frozenContent` is the plain-text fallback for
 * retired types / param drift. Whoever triggered a notification travels in
 * `params`, so there are no actor columns. `recipientId` is the only FK;
 * `requestId` is an FK-less ref.
 */
export function createNotificationsPartialDefinition(
  notificationsFeatureName: string,
  userModelName: string,
): PartialProjectDefinitionInput {
  return {
    features: FeatureUtils.createPartialFeatures(notificationsFeatureName),
    models: [
      {
        name: NOTIFICATION_MODELS.notification,
        featureRef: notificationsFeatureName,
        model: {
          fields: [
            {
              name: 'id',
              type: 'uuid',
              options: { defaultGeneration: 'uuidv7' },
            },
            // Renderer key: (type, templateVersion). See NotificationTypeDefinition.
            {
              name: 'type',
              type: 'string',
            },
            {
              name: 'templateVersion',
              type: 'int',
              options: { default: '1' },
            },
            {
              name: 'recipientId',
              type: 'uuid',
            },
            // The dispatch that produced this row. Deliberately FK-LESS: the
            // request is transient and disposable once its deliveries settle,
            // while this row is durable — a relation would tie their lifetimes
            // together. Still the fan-out dedupe key via
            // @@unique(requestId, recipientId).
            {
              name: 'requestId',
              type: 'uuid',
              isOptional: true,
            },
            // Routing outcome stamped at fan-out (type config + user prefs):
            // whether this row appears in the feed. Rows are written for every
            // channel, so an email-only notification is `false` here and is
            // filtered out of the feed and the badge.
            //
            // Defaults to `true` only so that rows predating this column keep
            // showing in the feed when a project adds it; the fan-out always
            // writes the value explicitly.
            {
              name: 'inApp',
              type: 'boolean',
              options: { default: 'true' },
            },

            // Render source of truth: must be JSON-serializable + snapshot-complete.
            {
              name: 'params',
              type: 'json',
              isOptional: true,
            },

            // Frozen fallback snapshot (see header): plain strings, read only
            // on retired type / param drift. One blob rather than a column per
            // field because nothing queries it — it is read back whole or not
            // at all, and a project widens its shape in generated code.
            {
              name: 'frozenContent',
              type: 'json',
              isOptional: true,
            },

            // --- Identity ---
            // The stable identity of the FACT this row is about, DERIVED BY THE
            // TYPE from its input (`post:123:likes`) rather than passed at a
            // call site — the like-side and unlike-side paths must produce
            // byte-identical keys or a retraction silently misses. One row per
            // (type, groupKey, recipient), replaced in place as the fact
            // evolves — the one-notification-per-thread model. This single
            // column is idempotency, aggregation, and retraction at once:
            // replaying identical state is a no-op, collapsing is just
            // replacing at the same key, and withdrawing is a lookup on it.
            //
            // Types that derive no key get a generated one, which collapses
            // with nothing and cannot be retracted — the fire-and-forget
            // default.
            {
              name: 'groupKey',
              type: 'string',
            },
            // Feed sort key, reissued whenever the row's state really changes,
            // so an evolving row resurfaces to the top. Separate from `id`
            // because `id` cannot be reissued: `NotificationDelivery` cascades
            // off it. Not `updatedAt` either — that bumps on any write, so
            // marking a row read would resurface it, and its ties break cursor
            // pagination. A plain `DateTime` was considered and rejected:
            // `timestamp(3)` ties under the per-recipient upsert loop, and a
            // Relay cursor over a non-unique column silently skips or repeats
            // rows at the page boundary.
            {
              name: 'feedSortKey',
              type: 'uuid',
              options: { defaultGeneration: 'uuidv7' },
            },

            // --- State ---
            {
              name: 'seenAt',
              type: 'dateTime',
              isOptional: true,
            },
            {
              name: 'readAt',
              type: 'dateTime',
              isOptional: true,
            },
            // Soft delete: the user cleared it from the feed. The row survives
            // so its deliveries keep their parent — dismissing an in-app copy
            // does not cancel the email. Retention hard-deletes it later, once
            // every delivery is terminal.
            {
              name: 'dismissedAt',
              type: 'dateTime',
              isOptional: true,
            },
            {
              name: 'createdAt',
              type: 'dateTime',
              options: { defaultToNow: true },
            },
            // Retention horizon, stamped at fan-out. Optional so rows written
            // before this column keep the old never-expire behaviour rather
            // than being reaped en masse on the first sweep after upgrade.
            {
              name: 'expiresAt',
              type: 'dateTime',
              isOptional: true,
            },
          ],
          primaryKeyFieldRefs: ['id'],
          // The two hot access paths: the feed (recipient + newest-first) and
          // the badge count (recipient + unseen). Both lead with `inApp`, since
          // every query filters on it — a partial index WHERE inApp would be
          // ideal but the schema layer has no `where`, so the column sits in
          // the key instead and email-only rows cost size, not scans.
          // The feed sorts by `feedSortKey` alone — a uuidv7 is both
          // time-ordered and unique, so it is a total order on its own, which
          // is what cursor pagination needs. Sorting by the reissued key rather
          // than `id` is what lets a replaced row resurface.
          indexes: [
            {
              fields: [
                { fieldRef: 'recipientId' },
                { fieldRef: 'inApp' },
                { fieldRef: 'feedSortKey' },
              ],
            },
            {
              fields: [
                { fieldRef: 'recipientId' },
                { fieldRef: 'inApp' },
                { fieldRef: 'seenAt' },
              ],
            },
            // Retention sweep: scans by horizon across all recipients, so it
            // leads with `expiresAt` rather than reusing the feed indexes.
            {
              fields: [{ fieldRef: 'expiresAt' }],
            },
          ],
          uniqueConstraints: [
            // Idempotency layer 2, and the delivery worker's read path. UNIQUE
            // rather than a plain index: it is what makes `createMany`'s
            // `skipDuplicates` actually skip, so replaying a request cannot
            // write a second copy of the same person's notification.
            {
              fields: [{ fieldRef: 'requestId' }, { fieldRef: 'recipientId' }],
            },
            // One row per (type, fact, recipient). The upsert target for every
            // write and the lookup for every retraction — which is why the
            // retract path needs no index of its own.
            //
            // THE COLUMN ORDER IS LOAD-BEARING. `groupKey` is
            // recipient-independent, so leading with `(type, groupKey)` makes
            // "every recipient holding this fact" an indexed prefix scan. That
            // is what lets a bulk retraction find the whole audience of a
            // withdrawn fact without entity columns to look it up by. Ordering
            // it `(recipientId, type, groupKey)` would serve the single-row
            // upsert equally well but force a full scan for that audience
            // query.
            {
              fields: [
                { fieldRef: 'type' },
                { fieldRef: 'groupKey' },
                { fieldRef: 'recipientId' },
              ],
            },
            // Single-field, so this emits an inline `@unique` rather than a
            // composite. Required: Pothos types a connection's `cursor` as a
            // unique field, and `feedSortKey` is the feed cursor.
            {
              fields: [{ fieldRef: 'feedSortKey' }],
            },
          ],
          relations: [
            {
              name: 'recipient',
              references: [{ localRef: 'recipientId', foreignRef: 'id' }],
              modelRef: userModelName,
              foreignRelationName: 'notifications',
              onDelete: 'Cascade',
              onUpdate: 'Restrict',
            },
          ],
        },
        graphql: {
          objectType: {
            enabled: true,
            // Only stable, non-content columns are auto-exposed. Content is
            // served via the `content(locale:)` field instead. The `json`
            // columns are excluded regardless: auto-exposure maps them to
            // `exposeString` (see writers/pothos/scalars.ts), which is wrong.
            fields: [
              { ref: 'id' },
              { ref: 'type' },
              { ref: 'seenAt' },
              { ref: 'readAt' },
              { ref: 'createdAt' },
            ],
          },
        },
      },
      // --- Outbox ---
      // Internal delivery state. Neither model declares a `graphql` block: they
      // are infrastructure, never served to clients.
      {
        name: NOTIFICATION_MODELS.notificationRequest,
        featureRef: notificationsFeatureName,
        model: {
          fields: [
            {
              name: 'id',
              type: 'uuid',
              options: { defaultGeneration: 'uuidv7' },
            },
            // The render inputs, held once per fan-out rather than per
            // recipient — every materialized row renders from these.
            {
              name: 'type',
              type: 'string',
            },
            {
              name: 'templateVersion',
              type: 'int',
              options: { default: '1' },
            },
            {
              name: 'params',
              type: 'json',
              isOptional: true,
            },
            // The frozen fallback snapshot, same as Notification.frozenContent.
            {
              name: 'frozenContent',
              type: 'json',
              isOptional: true,
            },
            // pending | done. Flipped once every row and delivery job for this
            // request has been handed off. The one thing the sweeper watches:
            // a request still pending past the retry window had its hand-off
            // interrupted, and re-running it fills the gaps.
            {
              name: 'fanoutStatus',
              type: 'string',
              options: { default: 'pending' },
            },
            {
              name: 'createdAt',
              type: 'dateTime',
              options: { defaultToNow: true },
            },
          ],
          primaryKeyFieldRefs: ['id'],
          // No dedupe key of its own: row-level upsert on `groupKey` is the
          // idempotency boundary, so a request is always a fresh dispatch
          // record and replaying one collapses at the notification instead.
          // The sweeper's scan.
          indexes: [
            {
              fields: [{ fieldRef: 'fanoutStatus' }, { fieldRef: 'createdAt' }],
            },
          ],
        },
      },
      {
        name: NOTIFICATION_MODELS.notificationDelivery,
        featureRef: notificationsFeatureName,
        model: {
          fields: [
            {
              name: 'id',
              type: 'uuid',
              options: { defaultGeneration: 'uuidv7' },
            },
            // The recipient's row this delivery serves.
            {
              name: 'notificationId',
              type: 'uuid',
            },
            // Denormalized from the notification so a request's deliveries can
            // be found without a join.
            {
              name: 'requestId',
              type: 'uuid',
            },
            {
              name: 'channel',
              type: 'string',
            },
            // Which generation of the notification this delivery serves —
            // a copy of the row's `feedSortKey` at the time it was armed.
            //
            // A keyed row is replaced in place, so without this a re-armed
            // delivery would collide with the settled one from the previous
            // generation and be skipped: the second burst of activity would
            // never send. Carrying it makes each real change eligible for one
            // fresh delivery per channel, while replays inside a generation
            // still collapse.
            {
              name: 'feedSortKey',
              type: 'uuid',
            },
            // pending | delivered | failed | skipped. A ledger the queue never
            // reads: it records what happened, for digests, support questions
            // and retention. A plain string rather than an enum, which would
            // surface this infrastructure model in the enum catalog.
            {
              name: 'status',
              type: 'string',
              options: { default: 'pending' },
            },
            // Bookkeeping only — the queue owns the retry limit.
            {
              name: 'attempts',
              type: 'int',
              options: { default: '0' },
            },
            {
              name: 'lastError',
              type: 'string',
              isOptional: true,
            },
            // Distinct from `updatedAt`, which also moves on a failed attempt.
            {
              name: 'deliveredAt',
              type: 'dateTime',
              isOptional: true,
            },
            {
              name: 'createdAt',
              type: 'dateTime',
              options: { defaultToNow: true },
            },
            {
              name: 'updatedAt',
              type: 'dateTime',
              options: { defaultToNow: true, updatedAt: true },
            },
          ],
          primaryKeyFieldRefs: ['id'],
          // One row per channel per generation, so a concurrent replay collides
          // here instead of double-enqueuing, and one bounced address fails its
          // own row rather than a whole chunk. `feedSortKey` is in the key so a
          // replaced row can arm a fresh send without colliding with the
          // settled delivery of the generation before it.
          uniqueConstraints: [
            {
              fields: [
                { fieldRef: 'notificationId' },
                { fieldRef: 'channel' },
                { fieldRef: 'feedSortKey' },
              ],
            },
          ],
          // The sweeper's scan: stale rows still `pending`.
          indexes: [
            { fields: [{ fieldRef: 'status' }, { fieldRef: 'createdAt' }] },
          ],
          // Only the notification is a relation. `requestId` stays a plain
          // denormalized column: the request is transient, so a FK would tie a
          // durable row's lifetime to it.
          relations: [
            {
              name: 'notification',
              references: [{ localRef: 'notificationId', foreignRef: 'id' }],
              modelRef: NOTIFICATION_MODELS.notification,
              foreignRelationName: 'deliveries',
              onDelete: 'Cascade',
              onUpdate: 'Restrict',
            },
          ],
        },
      },
      // --- Preferences ---
      // Sparse overrides on the Builder-declared topic defaults: a row exists
      // only where a user has actually chosen. Absence means "use the default",
      // so shipping a new topic needs no backfill — and truncating the table
      // returns every user to the Builder defaults rather than to "off".
      {
        name: NOTIFICATION_MODELS.notificationPreference,
        featureRef: notificationsFeatureName,
        model: {
          fields: [
            {
              name: 'id',
              type: 'uuid',
              options: { defaultGeneration: 'uuidv7' },
            },
            {
              name: 'userId',
              type: 'uuid',
            },
            // A topic key — never a Builder entity id. Keeping keys puts the
            // generated const, the runtime lookup and this column on one
            // identifier; renaming a topic is a data migration for these rows
            // as well as a compile error at every `defineNotificationType` site.
            //
            // Topics are the ONLY preference scope. A type outside every topic
            // consults no preference at all, so there is nothing to scope a row
            // to — which is what makes topic membership, rather than a
            // `mandatory` flag, the thing that decides whether a notification
            // is user-controllable.
            {
              name: 'topicKey',
              type: 'string',
            },
            // A routing target (`'inApp'` or an installed channel key), NOT a
            // `NotificationChannelKey`: `'inApp'` has no channel implementation
            // and `installedChannels` deliberately drops it, but a user must
            // still be able to silence the feed.
            {
              name: 'channel',
              type: 'string',
            },
            // off | immediate | digest. A plain string rather than an enum,
            // which would surface this infrastructure model in the enum
            // catalog. `digest` is outbound-only — the feed has no window to
            // batch over, so `inApp` accepts `off | immediate` only.
            {
              name: 'mode',
              type: 'string',
            },
            // Only meaningful when `mode` is `digest`. Optional rather than
            // defaulted: absence means "inherit the topic's window", so a user
            // who has only chosen `digest` does not get their window frozen at
            // whatever the Builder default happened to be that day.
            {
              name: 'digestWindowSeconds',
              type: 'int',
              isOptional: true,
            },
            {
              name: 'createdAt',
              type: 'dateTime',
              options: { defaultToNow: true },
            },
            {
              name: 'updatedAt',
              type: 'dateTime',
              options: { defaultToNow: true, updatedAt: true },
            },
          ],
          primaryKeyFieldRefs: ['id'],
          // One row per scope per channel, so a settings save can upsert rather
          // than read-modify-write.
          uniqueConstraints: [
            {
              fields: [
                { fieldRef: 'userId' },
                { fieldRef: 'topicKey' },
                { fieldRef: 'channel' },
              ],
            },
          ],
          // The resolver's read: every row for a fan-out's recipients scoped to
          // the type's topic.
          indexes: [
            { fields: [{ fieldRef: 'userId' }, { fieldRef: 'topicKey' }] },
          ],
          relations: [
            {
              name: 'user',
              references: [{ localRef: 'userId', foreignRef: 'id' }],
              modelRef: userModelName,
              foreignRelationName: 'notificationPreferences',
              onDelete: 'Cascade',
              onUpdate: 'Restrict',
            },
          ],
        },
      },
    ],
  };
}
