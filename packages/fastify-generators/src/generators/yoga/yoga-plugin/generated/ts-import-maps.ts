import type { TsImportMapProviderFromSchema } from '@halfdomelabs/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@halfdomelabs/core-generators';
import { createReadOnlyProviderType } from '@halfdomelabs/sync';
import path from 'node:path/posix';

const yogaPluginImportsSchema = createTsImportMapSchema({
  getGraphqlWsHandler: {},
  getPubSub: {},
  LiveQueryPayload: { isTypeOnly: true },
  makeHandler: {},
  useGraphLogger: {},
});

type YogaPluginImportsProvider = TsImportMapProviderFromSchema<
  typeof yogaPluginImportsSchema
>;

export const yogaPluginImportsProvider =
  createReadOnlyProviderType<YogaPluginImportsProvider>('yoga-plugin-imports');

export function createYogaPluginImports(
  importBase: string,
): YogaPluginImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(yogaPluginImportsSchema, {
    getGraphqlWsHandler: path.join(importBase, 'websocket.js'),
    getPubSub: path.join(importBase, 'pubsub.js'),
    LiveQueryPayload: path.join(importBase, 'pubsub.js'),
    makeHandler: path.join(importBase, 'websocket.js'),
    useGraphLogger: path.join(importBase, 'useGraphLogger.js'),
  });
}
