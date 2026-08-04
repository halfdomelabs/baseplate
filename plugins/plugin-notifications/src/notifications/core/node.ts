import { emailTemplateSpec } from '@baseplate-dev/plugin-email';
import {
  appCompilerSpec,
  authModelsSpec,
  backendAppEntryType,
  createPluginModule,
  pluginAppCompiler,
  PluginUtils,
  webAppEntryType,
} from '@baseplate-dev/project-builder-lib';

import type { NotificationsPluginDefinition } from './schema/plugin-definition.js';

import {
  notificationEmailTemplatesGenerator,
  notificationModuleGenerator,
  notificationWebGenerator,
} from './generators/index.js';
import { getNotificationsWebAppData } from './schema/web-app-schema.js';

/** Package name of the email plugin whose presence enables the email channel. */
const EMAIL_PLUGIN_PACKAGE = '@baseplate-dev/plugin-email';

export default createPluginModule({
  name: 'node',
  dependencies: {
    appCompiler: appCompilerSpec,
    emailTemplate: emailTemplateSpec,
  },
  initialize: ({ appCompiler, emailTemplate }, { pluginKey }) => {
    // Contribute the notification email component to the transactional lib. Safe
    // to push unconditionally: the transactional-lib compiler only runs when the
    // email plugin is enabled, so this is a no-op otherwise.
    emailTemplate.generators.push(notificationEmailTemplatesGenerator({}));

    appCompiler.compilers.push(
      // Backend: generate the notification module into the configured feature.
      pluginAppCompiler({
        pluginKey,
        appType: backendAppEntryType,
        compile: ({ projectDefinition, definitionContainer, appCompiler }) => {
          const notifications = PluginUtils.configByKeyOrThrow(
            projectDefinition,
            pluginKey,
          ) as NotificationsPluginDefinition;

          // Delivery reads recipient addresses directly, so the module needs
          // the app's user model — its name is configurable.
          const userModelName = definitionContainer.pluginStore
            .use(authModelsSpec)
            .getAuthModelsOrThrow(projectDefinition).user;

          // The email channel is generated only when the email plugin is
          // enabled — otherwise it would import a module that doesn't exist.
          const includeEmailChannel = (projectDefinition.plugins ?? []).some(
            (plugin) => plugin.packageName === EMAIL_PLUGIN_PACKAGE,
          );

          appCompiler.addChildrenToFeature(
            notifications.notificationsFeatureRef,
            {
              notificationModule: notificationModuleGenerator({
                includeEmailChannel,
                userModelName,
                topics: notifications.topics,
              }),
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
          const includeNotifications =
            getNotificationsWebAppData(appDefinition, pluginKey)
              ?.includeNotifications ?? false;
          if (!includeNotifications) {
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
