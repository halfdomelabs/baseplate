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
 * Per-app local-auth settings contributed to the web app config via
 * `webAppSchemaExtensionSpec`, stored under `pluginData[localAuthPluginKey]`.
 */
export const createLocalAuthWebAppSchema = definitionSchema((ctx) =>
  z.object({
    disableRegistration: ctx.withDefault(z.boolean(), false),
  }),
);

export type LocalAuthWebAppData = def.InferOutput<
  typeof createLocalAuthWebAppSchema
>;

/**
 * Reads the local-auth per-app settings slice from a web app config.
 */
export function getLocalAuthWebAppData(
  webApp: WebAppConfigWithPluginData,
  pluginKey: string,
): LocalAuthWebAppData | undefined {
  return getWebAppPluginData(webApp, pluginKey) as
    | LocalAuthWebAppData
    | undefined;
}
