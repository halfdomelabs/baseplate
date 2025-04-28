import type { TsImportMapProviderFromSchema } from '@halfdomelabs/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@halfdomelabs/core-generators';
import { createReadOnlyProviderType } from '@halfdomelabs/sync';
import path from 'node:path/posix';

const yogaPluginImportsSchema = createTsImportMapSchema({
  LiveQueryPayload: { isTypeOnly: true },
  getGraphqlWsHandler: {},
  getPubSub: {},
  graphqlPlugin: {},
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
    LiveQueryPayload: path.join(importBase, 'pubsub.js'),
    getGraphqlWsHandler: path.join(importBase, 'websocket.js'),
    getPubSub: path.join(importBase, 'pubsub.js'),
    graphqlPlugin: path.join(importBase, 'index.js'),
    makeHandler: path.join(importBase, 'websocket.js'),
    useGraphLogger: path.join(importBase, 'useGraphLogger.js'),
  });
}
