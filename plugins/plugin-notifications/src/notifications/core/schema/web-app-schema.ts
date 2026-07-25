import type {
  def,
  WebAppConfigWithPluginData,
} from '@baseplate-dev/project-builder-lib';

import {
  definitionSchema,
  getWebAppPluginData,
} from '@baseplate-dev/project-builder-lib';
import z from 'zod';

/**
 * Per-app notifications settings contributed to the web app config via
 * `webAppSchemaExtensionSpec`, stored under `pluginData[notificationsPluginKey]`.
 */
export const createNotificationsWebAppSchema = definitionSchema((ctx) =>
  z.object({
    includeNotifications: ctx.withDefault(z.boolean(), false),
  }),
);

export type NotificationsWebAppData = def.InferOutput<
  typeof createNotificationsWebAppSchema
>;

/**
 * Reads the notifications per-app settings slice from a web app config.
 */
export function getNotificationsWebAppData(
  webApp: WebAppConfigWithPluginData,
  pluginKey: string,
): NotificationsWebAppData | undefined {
  return getWebAppPluginData<NotificationsWebAppData>(webApp, pluginKey);
}
