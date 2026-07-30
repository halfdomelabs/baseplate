import type { PartialProjectDefinitionInput } from '@baseplate-dev/project-builder-lib';

import { FeatureUtils } from '@baseplate-dev/project-builder-lib';

import { NOTIFICATION_MODELS } from '#src/notifications/constants/model-names.js';

/**
 * Builds the partial project definition contributed by the notifications plugin.
 *
 * Three models, three lifetimes. `NotificationFeedItem` is the DURABLE in-app
 * row — content plus seen/read state — holding its own copy of everything it
 * renders from, so it survives its request being pruned.
 * `NotificationRequest` is TRANSIENT dispatch state (the worker's render
 * source), and `NotificationDelivery` tracks one job and dies with it.
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
        name: NOTIFICATION_MODELS.notificationFeedItem,
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

            // NOTE: digest/aggregation grouping columns are deferred to the digest
            // engine, when their shape can be designed correctly.

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
            {
              name: 'createdAt',
              type: 'dateTime',
              options: { defaultToNow: true },
            },
          ],
          primaryKeyFieldRefs: ['id'],
          // The two hot access paths: the feed (recipient + newest-first) and
          // the unread count (recipient + unread). Without these both seq-scan.
          indexes: [
            { fields: [{ fieldRef: 'recipientId' }, { fieldRef: 'id' }] },
            { fields: [{ fieldRef: 'recipientId' }, { fieldRef: 'readAt' }] },
          ],
          // Idempotency layer 2, and the delivery worker's read path. UNIQUE
          // rather than a plain index: it is what makes `createMany`'s
          // `skipDuplicates` actually skip, so replaying a request cannot
          // write a second copy of the same person's notification.
          uniqueConstraints: [
            {
              fields: [{ fieldRef: 'requestId' }, { fieldRef: 'recipientId' }],
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
            // The frozen fallback snapshot, same as NotificationFeedItem.segments.
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
            {
              name: 'createdAt',
              type: 'dateTime',
              options: { defaultToNow: true },
            },
          ],
          primaryKeyFieldRefs: ['id'],
          // Idempotency layer 1: the upsert target.
          uniqueConstraints: [{ fields: [{ fieldRef: 'idempotencyKey' }] }],
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
            {
              name: 'requestId',
              type: 'uuid',
            },
            {
              name: 'channel',
              type: 'string',
            },
            // Which slice of the fan-out this row tracks. One row per (channel,
            // chunk) job, not per channel, so each chunk's delivery state is
            // tracked and swept independently.
            {
              name: 'chunkIndex',
              type: 'int',
              options: { default: '0' },
            },
            // The recipients this chunk covers, so the sweeper can re-enqueue
            // exactly the original job rather than re-reading and re-chunking
            // the entire request.
            {
              name: 'recipientIds',
              type: 'json',
            },
            // pending | enqueued | delivered | failed. A plain string with a
            // default rather than an enum: internal state, and an enum ref
            // would surface this infrastructure model in the enum catalog.
            {
              name: 'status',
              type: 'string',
              options: { default: 'pending' },
            },
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
          // One row per enqueued job, so a concurrent replay collides here
          // instead of double-enqueuing, and each chunk's state is tracked
          // independently.
          uniqueConstraints: [
            {
              fields: [
                { fieldRef: 'requestId' },
                { fieldRef: 'channel' },
                { fieldRef: 'chunkIndex' },
              ],
            },
          ],
          // The sweeper's scan: stale rows still `pending`.
          indexes: [
            { fields: [{ fieldRef: 'status' }, { fieldRef: 'createdAt' }] },
          ],
          relations: [
            {
              name: 'request',
              references: [{ localRef: 'requestId', foreignRef: 'id' }],
              modelRef: NOTIFICATION_MODELS.notificationRequest,
              foreignRelationName: 'deliveries',
              onDelete: 'Cascade',
              onUpdate: 'Restrict',
            },
          ],
        },
      },
    ],
  };
}
