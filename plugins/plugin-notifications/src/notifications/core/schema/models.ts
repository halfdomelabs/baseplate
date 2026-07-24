import type { PartialProjectDefinitionInput } from '@baseplate-dev/project-builder-lib';

import { FeatureUtils } from '@baseplate-dev/project-builder-lib';

import { NOTIFICATION_MODELS } from '#src/notifications/constants/model-names.js';

/**
 * Builds the partial project definition contributed by the notifications plugin.
 *
 * Render-at-read content model: `params` (render inputs) are the source of truth,
 * re-rendered per request; frozen `segments` + `fallbackText` are the fallback
 * for retired types / param drift. Actor is discriminated via `actorKind`.
 * `recipientId`/`actorId` are the only FKs; `entityType`/`entityId` are FK-less
 * polymorphic refs. Digest grouping columns are deferred (see note below).
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
            // Renderer key: (type, templateVersion) pins each row to the renderer
            // that produced it, so a copy/param refactor bumps the version rather
            // than silently rewriting history. Resolved against the app's
            // defineNotificationType() registry.
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
            {
              fields: [{ fieldRef: 'recipientId' }, { fieldRef: 'createdAt' }],
            },
            { fields: [{ fieldRef: 'recipientId' }, { fieldRef: 'readAt' }] },
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
            // Only stable, non-content columns are auto-exposed. Content
            // (segments/fallbackText/actionUrl) is served ATOMICALLY from a
            // single read-time render via the `content(locale:)` field — exposing
            // the frozen `fallbackText`/`actionUrl` columns here would let one
            // notification serve content from two renderer versions. The `json`
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
            // Live actor resolution: expose the `actor` relation so the object
            // type carries `actor: t.relation('actor')` (fresh name/avatar for
            // human actors), matching what `notification-content.field.ts` and
            // the mutations reference.
            localRelations: [{ ref: 'actor' }],
          },
        },
      },
    ],
  };
}
