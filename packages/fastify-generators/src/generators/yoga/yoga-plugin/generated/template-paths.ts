import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface YogaYogaPluginPaths {
  graphqlPlugin: string;
  pubsub: string;
  useGraphLogger: string;
  websocket: string;
}

const yogaYogaPluginPaths = createProviderType<YogaYogaPluginPaths>(
  'yoga-yoga-plugin-paths',
);

const yogaYogaPluginPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { yogaYogaPluginPaths: yogaYogaPluginPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        yogaYogaPluginPaths: {
          graphqlPlugin: `${srcRoot}/plugins/graphql/index.ts`,
          pubsub: `${srcRoot}/plugins/graphql/pubsub.ts`,
          useGraphLogger: `${srcRoot}/plugins/graphql/use-graph-logger.ts`,
          websocket: `${srcRoot}/plugins/graphql/websocket.ts`,
        },
      },
    };
  },
});

export const YOGA_YOGA_PLUGIN_PATHS = {
  provider: yogaYogaPluginPaths,
  task: yogaYogaPluginPathsTask,
};
