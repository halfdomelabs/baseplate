import type { PartialProjectDefinitionInput } from '@baseplate-dev/project-builder-lib';

import { FeatureUtils } from '@baseplate-dev/project-builder-lib';

import { NOTIFICATION_MODELS } from '#src/notifications/constants/model-names.js';

/**
 * Builds the partial project definition contributed by the notifications plugin.
 *
 * Content model: the notification stores normalized rendered `segments` (the
 * content IR) plus a plain `fallbackText` flattening, rendered/frozen at notify()
 * time. The `messageId` + `params` columns are the backend-i18n seam — locale
 * independent facts kept so content can be re-rendered later without a migration.
 *
 * Actor is discriminated (`actorKind`: user | system | none). For human actors we
 * keep a live relation (`actorUserId` -> User) plus a frozen `actorLabel` as a
 * deletion fallback (name only — the avatar comes live from the relation, or
 * falls back to initials once the user is gone). System actor assets are NOT
 * stored per row — only `systemActorKey` (resolved against a config dictionary).
 *
 * The only hard FK to a domain table is `recipientId` (and the optional
 * `actorId`); `entityType`/`entityId` are plain columns so a notification can
 * reference any entity type without a strict relation. Digest/aggregation
 * grouping columns are deferred to the digest engine (see note below).
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
            // The notification-type key (e.g. "post.liked"). Resolved against the
            // generated app's defineNotificationType() registry.
            {
              name: 'type',
              type: 'string',
            },
            // Recipient relation (the one stable foreign key).
            {
              name: 'recipientId',
              type: 'uuid',
            },

            // --- Content (frozen rendered output = source of truth) ---
            // Content is rendered to segments at notify() time and FROZEN. The
            // frozen `segments` + `fallbackText` are what the feed DISPLAYS, and
            // they never rot: evolving a message's wording or param shape only
            // affects future notifications, never history (the Novu/Courier freeze
            // model). Normalized Segment[] rendered and frozen at notify() time.
            {
              name: 'segments',
              type: 'json',
            },
            // Plain-text flattening: SMS / a11y / list display / catalog-miss.
            {
              name: 'fallbackText',
              type: 'string',
            },

            // --- Provenance (metadata, NOT the render path) ---
            // messageId + params are stored ALONGSIDE the frozen content as
            // provenance: useful for analytics/grouping now, and the seam for
            // opt-in live i18n later (validate params against the current template
            // at read time → render live, else fall back to the frozen segments).
            // Because the frozen content is the display source of truth, evolving
            // the param shape can never break historical rows.
            {
              name: 'messageId',
              type: 'string',
              isOptional: true,
            },
            {
              name: 'params',
              type: 'json',
              isOptional: true,
            },

            // --- Actor (discriminated; snapshot cols are human fallback only) ---
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
            // Frozen name fallback for a DELETED human actor only (avatar is not
            // frozen — a live user's avatar comes from the relation, a deleted
            // user renders initials from this label).
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

            // --- Polymorphic subject reference (no FK) ---
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

            // NOTE: digest/aggregation grouping columns (e.g. a dedup key and an
            // event count, or a separate NotificationEvent table) are
            // intentionally deferred to the digest engine, when their shape can be
            // designed correctly. Adding model fields later is cheap in this
            // codebase (models.ts edit + sync migration), so we avoid shipping
            // speculative columns whose shape we'd be guessing now.

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
            // NOTE: `segments`/`params` (json) are intentionally NOT auto-exposed
            // here. The model's auto GraphQL exposure maps `json` fields to
            // `exposeString` (see writers/pothos/scalars.ts), which is wrong for a
            // JSON column. The notification-graphql generator exposes `segments`
            // via a dedicated `JSON` scalar field instead.
            fields: [
              { ref: 'id' },
              { ref: 'type' },
              { ref: 'fallbackText' },
              { ref: 'actionUrl' },
              { ref: 'entityType' },
              { ref: 'entityId' },
              { ref: 'seenAt' },
              { ref: 'readAt' },
              { ref: 'createdAt' },
            ],
          },
        },
      },
    ],
  };
}
