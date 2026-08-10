import { agentDocCompiler, agentDocsSpec } from '@baseplate-dev/plugin-ai';
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

const NOTIFICATIONS_DOC = `# Notification Topics

This project uses the \`notifications\` plugin to deliver in-app and (if the email plugin is enabled) email notifications with per-user preferences.

## Configuring topics

Use the Baseplate MCP \`configure-plugin\` tool with \`pluginKey: 'notifications'\` to add or edit entries under \`topics\`. A topic is the unit users express a preference over. Each topic has:

- **key** — camelCase identifier stored on preference rows and referenced by \`defineNotificationType\`
- **label** — display name shown in the preferences UI
- **description** — optional helper copy for the preferences UI
- **defaults** — per-channel default mode (\`off\`, \`immediate\`, or \`digest\`) used when a user has no preference row for this topic

Every project starts with a \`general\` topic; add more when notification types need independent user control.

## Defining notification types

Notification types are NOT configured through the project definition — they're declared in application code with \`defineNotificationType\` (generated into the notification module), specifying the type's \`key\`, \`version\`, \`topic\` (one of the keys above), \`paramsSchema\`, allowed \`channels\`, and a \`render\` function. A type with no \`topic\` consults no preference and cannot be suppressed by the user.

Run \`sync-project\` after committing topic changes to regenerate the notification module.
`;

export default createPluginModule({
  name: 'node',
  dependencies: {
    appCompiler: appCompilerSpec,
    emailTemplate: emailTemplateSpec,
    agentDocs: agentDocsSpec,
  },
  initialize: ({ appCompiler, emailTemplate, agentDocs }, { pluginKey }) => {
    // Contribute the notification email component to the transactional lib. Safe
    // to push unconditionally: the transactional-lib compiler only runs when the
    // email plugin is enabled, so this is a no-op otherwise.
    emailTemplate.generators.push(notificationEmailTemplatesGenerator({}));

    agentDocs.compilers.push(
      agentDocCompiler({
        pluginKey,
        compile: () => ({
          'notification-topics': {
            id: 'notification-topics',
            description:
              'how to configure notification topics and define notification types',
            content: NOTIFICATIONS_DOC,
          },
        }),
      }),
    );

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
