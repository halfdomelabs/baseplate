import type { RenderTsTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  authHooksImportsProvider,
  graphqlImportsProvider,
  reactComponentsImportsProvider,
} from '@baseplate-dev/react-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { NOTIFICATIONS_CORE_NOTIFICATION_WEB_PATHS } from './template-paths.js';
import { NOTIFICATIONS_CORE_NOTIFICATION_WEB_TEMPLATES } from './typed-templates.js';

export interface NotificationsCoreNotificationWebRenderers {
  notificationsGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof NOTIFICATIONS_CORE_NOTIFICATION_WEB_TEMPLATES.notificationsGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const notificationsCoreNotificationWebRenderers =
  createProviderType<NotificationsCoreNotificationWebRenderers>(
    'notifications-core-notification-web-renderers',
  );

const notificationsCoreNotificationWebRenderersTask = createGeneratorTask({
  dependencies: {
    authHooksImports: authHooksImportsProvider,
    graphqlImports: graphqlImportsProvider,
    paths: NOTIFICATIONS_CORE_NOTIFICATION_WEB_PATHS.provider,
    reactComponentsImports: reactComponentsImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    notificationsCoreNotificationWebRenderers:
      notificationsCoreNotificationWebRenderers.export(),
  },
  run({
    authHooksImports,
    graphqlImports,
    paths,
    reactComponentsImports,
    typescriptFile,
  }) {
    return {
      providers: {
        notificationsCoreNotificationWebRenderers: {
          notificationsGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group:
                  NOTIFICATIONS_CORE_NOTIFICATION_WEB_TEMPLATES.notificationsGroup,
                paths,
                importMapProviders: {
                  authHooksImports,
                  graphqlImports,
                  reactComponentsImports,
                },
                generatorPaths: paths,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const NOTIFICATIONS_CORE_NOTIFICATION_WEB_RENDERERS = {
  provider: notificationsCoreNotificationWebRenderers,
  task: notificationsCoreNotificationWebRenderersTask,
};
