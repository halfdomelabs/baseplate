import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
  packageScope,
} from '@baseplate-dev/core-generators';
import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import { YOGA_YOGA_PLUGIN_PATHS } from './template-paths.js';

export const yogaPluginImportsSchema = createTsImportMapSchema({
  createGraphqlPubSub: {},
  PubSubPublishArgs: { isTypeOnly: true },
});

export type YogaPluginImportsProvider = TsImportMapProviderFromSchema<
  typeof yogaPluginImportsSchema
>;

export const yogaPluginImportsProvider =
  createReadOnlyProviderType<YogaPluginImportsProvider>('yoga-plugin-imports');

const yogaYogaPluginImportsTask = createGeneratorTask({
  dependencies: {
    paths: YOGA_YOGA_PLUGIN_PATHS.provider,
  },
  exports: {
    yogaPluginImports: yogaPluginImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        yogaPluginImports: createTsImportMap(yogaPluginImportsSchema, {
          createGraphqlPubSub: paths.pubsub,
          PubSubPublishArgs: paths.pubsub,
        }),
      },
    };
  },
});

export const YOGA_YOGA_PLUGIN_IMPORTS = {
  generatorName: '@baseplate-dev/fastify-generators#yoga/yoga-plugin',
  task: yogaYogaPluginImportsTask,
};
