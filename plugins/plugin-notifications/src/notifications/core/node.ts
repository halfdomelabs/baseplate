import {
  appCompilerSpec,
  backendAppEntryType,
  createPluginModule,
  pluginAppCompiler,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';

import type { NotificationsPluginDefinition } from './schema/plugin-definition.js';

import { notificationModuleGenerator } from './generators/index.js';

export default createPluginModule({
  name: 'node',
  dependencies: {
    appCompiler: appCompilerSpec,
  },
  initialize: ({ appCompiler }, { pluginKey }) => {
    appCompiler.compilers.push(
      // Backend: generate the notification module into the configured feature.
      pluginAppCompiler({
        pluginKey,
        appType: backendAppEntryType,
        compile: ({ projectDefinition, appCompiler }) => {
          const notifications = PluginUtils.configByKeyOrThrow(
            projectDefinition,
            pluginKey,
          ) as NotificationsPluginDefinition;

          appCompiler.addChildrenToFeature(
            notifications.notificationsFeatureRef,
            {
              notificationModule: notificationModuleGenerator({}),
            },
          );
        },
      }),
    );
  },
});
