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
 * Per-app storage settings contributed to the web app config via
 * `webAppSchemaExtensionSpec`, stored under `pluginData[storagePluginKey]`.
 */
export const createStorageWebAppSchema = definitionSchema((ctx) =>
  z.object({
    includeUploadComponents: ctx.withDefault(z.boolean(), false),
  }),
);

export type StorageWebAppData = def.InferOutput<
  typeof createStorageWebAppSchema
>;

/**
 * Reads the storage per-app settings slice from a web app config.
 */
export function getStorageWebAppData(
  webApp: WebAppConfigWithPluginData,
  pluginKey: string,
): StorageWebAppData | undefined {
  return getWebAppPluginData<StorageWebAppData>(webApp, pluginKey);
}
