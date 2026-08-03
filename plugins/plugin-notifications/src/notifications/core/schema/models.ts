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
 * sparse per-user overrides on the Builder-declared category defaults.
 *
 * Render-at-read content model: `params` (render inputs) are the source of truth,
 * re-rendered per request; frozen `segments` + `fallbackText` are the fallback
 * for retired types / param drift. Actor is discriminated via `actorKind`.
 * `recipientId`/`actorId` are the only FKs; `entityType`/`entityId` and
 * `requestId` are FK-less refs. Digest grouping columns are deferred.
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
            // The dispatch that produced this row. Deliberately FK-LESS (like
            // entityType/entityId): the request is transient and disposable
            // once its deliveries settle, while this row is durable — a
            // relation would tie their lifetimes together. Still the fan-out
            // dedupe key via @@unique(requestId, recipientId).
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

            // Frozen fallback snapshot (see header): the feed renders from
            // `params`; these are used only on retired type / param drift.
            {
              name: 'segments',
              type: 'json',
            },
            // Plain-text flattening: SMS / a11y / list display / catalog-miss.
            {
              name: 'fallbackText',
              type: 'string',
            },

            // Render source of truth: must be JSON-serializable + snapshot-complete.
            {
              name: 'params',
              type: 'json',
              isOptional: true,
            },

            // Actor (discriminated by actorKind: user | system | none).
            {
              name: 'actorKind',
              type: 'string',
              options: { default: 'none' },
            },
            {
              name: 'actorId',
              type: 'uuid',
              isOptional: true,
            },
            // Frozen name fallback for a deleted human actor.
            {
              name: 'actorLabel',
              type: 'string',
              isOptional: true,
            },
            // Indexes the SYSTEM_ACTORS config dictionary (kind = 'system').
            {
              name: 'systemActorKey',
              type: 'string',
              isOptional: true,
            },

            // Polymorphic subject reference (no FK).
            {
              name: 'entityType',
              type: 'string',
              isOptional: true,
            },
            {
              name: 'entityId',
              type: 'string',
              isOptional: true,
            },

            // --- Identity ---
            // The stable identity of the FACT this row is about, chosen by the
            // caller (`post:123:likes`). One row per (recipient, key), replaced
            // in place as the fact evolves — the one-notification-per-thread
            // model. This single column is idempotency, aggregation, and
            // retraction at once: replaying identical state is a no-op,
            // collapsing is just replacing at the same key, and withdrawing is a
            // lookup on it.
            //
            // Callers that omit a key get a generated one, which collapses with
            // nothing and cannot be retracted — the fire-and-forget default.
            {
              name: 'key',
              type: 'string',
            },
            // Feed sort key, reissued whenever the row's state really changes,
            // so an evolving row resurfaces to the top. Separate from `id`
            // because `id` cannot be reissued: `NotificationDelivery` cascades
            // off it. Not `updatedAt` either — that bumps on any write, so
            // marking a row read would resurface it, and its ties break cursor
            // pagination.
            {
              name: 'feedOrderId',
              type: 'uuid',
              options: { defaultGeneration: 'uuidv7' },
            },

            // --- State ---
            {
              name: 'actionUrl',
              type: 'string',
              isOptional: true,
            },
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
          // The feed sorts by `feedOrderId` alone — a uuidv7 is both
          // time-ordered and unique, so it is a total order on its own, which
          // is what cursor pagination needs. Sorting by the reissued key rather
          // than `id` is what lets a replaced row resurface.
          indexes: [
            {
              fields: [
                { fieldRef: 'recipientId' },
                { fieldRef: 'inApp' },
                { fieldRef: 'feedOrderId' },
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
            // One row per (recipient, fact). The upsert target for every write
            // and the lookup for every retraction — which is why the retract
            // path needs no index of its own.
            {
              fields: [{ fieldRef: 'recipientId' }, { fieldRef: 'key' }],
            },
            // Single-field, so this emits an inline `@unique` rather than a
            // composite. Required: Pothos types a connection's `cursor` as a
            // unique field, and `feedOrderId` is the feed cursor.
            {
              fields: [{ fieldRef: 'feedOrderId' }],
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
            // Live actor resolution (fresh name/avatar for human actors).
            {
              name: 'actor',
              references: [{ localRef: 'actorId', foreignRef: 'id' }],
              modelRef: userModelName,
              foreignRelationName: 'actorNotifications',
              onDelete: 'SetNull',
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
              { ref: 'entityType' },
              { ref: 'entityId' },
              { ref: 'seenAt' },
              { ref: 'readAt' },
              { ref: 'createdAt' },
            ],
            localRelations: [{ ref: 'actor' }],
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
            // The frozen fallback snapshot, same as Notification.segments.
            {
              name: 'segments',
              type: 'json',
            },
            {
              name: 'fallbackText',
              type: 'string',
            },
            {
              name: 'actionUrl',
              type: 'string',
              isOptional: true,
            },
            // Caller-supplied dedupe key. Optional: absent means "always a new
            // request", so two legitimately identical notifications are never
            // collapsed. Present means at-most-once per key.
            {
              name: 'idempotencyKey',
              type: 'string',
              isOptional: true,
            },
            {
              name: 'actorKind',
              type: 'string',
              options: { default: 'none' },
            },
            {
              name: 'actorId',
              type: 'uuid',
              isOptional: true,
            },
            {
              name: 'entityType',
              type: 'string',
              isOptional: true,
            },
            {
              name: 'entityId',
              type: 'string',
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
          // Idempotency layer 1: the upsert target.
          uniqueConstraints: [{ fields: [{ fieldRef: 'idempotencyKey' }] }],
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
            // a copy of the row's `feedOrderId` at the time it was armed.
            //
            // A keyed row is replaced in place, so without this a re-armed
            // delivery would collide with the settled one from the previous
            // generation and be skipped: the second burst of activity would
            // never send. Carrying it makes each real change eligible for one
            // fresh delivery per channel, while replays inside a generation
            // still collapse.
            {
              name: 'feedOrderId',
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
          // own row rather than a whole chunk. `feedOrderId` is in the key so a
          // replaced row can arm a fresh send without colliding with the
          // settled delivery of the generation before it.
          uniqueConstraints: [
            {
              fields: [
                { fieldRef: 'notificationId' },
                { fieldRef: 'channel' },
                { fieldRef: 'feedOrderId' },
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
      // Sparse overrides on the Builder-declared category defaults: a row exists
      // only where a user has actually chosen. Absence means "use the default",
      // so shipping a new category needs no backfill.
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
            // category | type. A plain string rather than an enum, which would
            // surface this infrastructure model in the enum catalog. Entity-level
            // muting would add a third value here rather than a new table.
            {
              name: 'scopeKind',
              type: 'string',
            },
            // A category key or a notification type key, depending on
            // `scopeKind` — never a Builder entity id. Keeping keys puts the
            // generated const, the runtime lookup and this column on one
            // identifier; renaming a category is a data migration for these rows
            // as well as a compile error at every `defineNotificationType` site.
            {
              name: 'scopeKey',
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
            // Boolean for now. Digests (per-user/type windows) are the natural
            // next value here — `mode: 'off' | 'immediate' | 'digest'` — so that
            // work should upgrade this column rather than add a parallel table.
            {
              name: 'enabled',
              type: 'boolean',
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
                { fieldRef: 'scopeKind' },
                { fieldRef: 'scopeKey' },
                { fieldRef: 'channel' },
              ],
            },
          ],
          // The resolver's read: every row for a fan-out's recipients whose
          // scope is the type's category or the type itself.
          indexes: [
            { fields: [{ fieldRef: 'userId' }, { fieldRef: 'scopeKey' }] },
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
