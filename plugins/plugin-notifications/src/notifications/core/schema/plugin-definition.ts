import type { def } from '@baseplate-dev/project-builder-lib';

import {
  definitionSchema,
  featureEntityType,
} from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

/**
 * Configuration schema for the notifications plugin.
 *
 * For the MVP this only tracks the feature the notification module is generated
 * into. Channel/preference configuration is intentionally deferred — notification
 * types are defined in generated application code via `defineNotificationType()`.
 */
export const createNotificationsPluginDefinitionSchema = definitionSchema(
  (ctx) =>
    z.object({
      notificationsFeatureRef: ctx.withRef({
        type: featureEntityType,
        onDelete: 'RESTRICT',
      }),
    }),
);

export type NotificationsPluginDefinition = def.InferOutput<
  typeof createNotificationsPluginDefinitionSchema
>;

export type NotificationsPluginDefinitionInput = def.InferInput<
  typeof createNotificationsPluginDefinitionSchema
>;
