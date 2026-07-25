import {
  appCompilerSpec,
  backendAppEntryType,
  createPluginModule,
  pluginAppCompiler,
  PluginUtils,
  webAppEntryType,
} from '@baseplate-dev/project-builder-lib';

import type { NotificationsPluginDefinition } from './schema/plugin-definition.js';

import {
  notificationModuleGenerator,
  notificationWebGenerator,
} from './generators/index.js';

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
      // Web: generate the notification bell/panel when opted into for this app.
      // Auto-mounts into the admin layout header if the app has one; otherwise
      // the components are generated for manual placement.
      pluginAppCompiler({
        pluginKey,
        appType: webAppEntryType,
        compile: ({ appCompiler, appDefinition }) => {
          if (!appDefinition.includeNotifications) {
            return;
          }

          appCompiler.addRootChildren({
            notificationWeb: notificationWebGenerator({}),
          });
        },
      }),
    );
  },
});
