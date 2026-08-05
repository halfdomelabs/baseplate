import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { transactionalLibImportsProvider } from '@baseplate-dev/plugin-email';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { NOTIFICATIONS_CORE_NOTIFICATION_EMAIL_TEMPLATES_PATHS } from './template-paths.js';
import { NOTIFICATIONS_CORE_NOTIFICATION_EMAIL_TEMPLATES_TEMPLATES } from './typed-templates.js';

export interface NotificationsCoreNotificationEmailTemplatesRenderers {
  notificationDigestEmail: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof NOTIFICATIONS_CORE_NOTIFICATION_EMAIL_TEMPLATES_TEMPLATES.notificationDigestEmail
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  notificationEmail: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof NOTIFICATIONS_CORE_NOTIFICATION_EMAIL_TEMPLATES_TEMPLATES.notificationEmail
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  notificationSegmentView: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof NOTIFICATIONS_CORE_NOTIFICATION_EMAIL_TEMPLATES_TEMPLATES.notificationSegmentView
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const notificationsCoreNotificationEmailTemplatesRenderers =
  createProviderType<NotificationsCoreNotificationEmailTemplatesRenderers>(
    'notifications-core-notification-email-templates-renderers',
  );

const notificationsCoreNotificationEmailTemplatesRenderersTask =
  createGeneratorTask({
    dependencies: {
      paths: NOTIFICATIONS_CORE_NOTIFICATION_EMAIL_TEMPLATES_PATHS.provider,
      transactionalLibImports: transactionalLibImportsProvider,
      typescriptFile: typescriptFileProvider,
    },
    exports: {
      notificationsCoreNotificationEmailTemplatesRenderers:
        notificationsCoreNotificationEmailTemplatesRenderers.export(),
    },
    run({ paths, transactionalLibImports, typescriptFile }) {
      return {
        providers: {
          notificationsCoreNotificationEmailTemplatesRenderers: {
            notificationDigestEmail: {
              render: (options) =>
                typescriptFile.renderTemplateFile({
                  template:
                    NOTIFICATIONS_CORE_NOTIFICATION_EMAIL_TEMPLATES_TEMPLATES.notificationDigestEmail,
                  destination: paths.notificationDigestEmail,
                  importMapProviders: {
                    transactionalLibImports,
                  },
                  generatorPaths: paths,
                  ...options,
                }),
            },
            notificationEmail: {
              render: (options) =>
                typescriptFile.renderTemplateFile({
                  template:
                    NOTIFICATIONS_CORE_NOTIFICATION_EMAIL_TEMPLATES_TEMPLATES.notificationEmail,
                  destination: paths.notificationEmail,
                  importMapProviders: {
                    transactionalLibImports,
                  },
                  generatorPaths: paths,
                  ...options,
                }),
            },
            notificationSegmentView: {
              render: (options) =>
                typescriptFile.renderTemplateFile({
                  template:
                    NOTIFICATIONS_CORE_NOTIFICATION_EMAIL_TEMPLATES_TEMPLATES.notificationSegmentView,
                  destination: paths.notificationSegmentView,
                  importMapProviders: {
                    transactionalLibImports,
                  },
                  ...options,
                }),
            },
          },
        },
      };
    },
  });

export const NOTIFICATIONS_CORE_NOTIFICATION_EMAIL_TEMPLATES_RENDERERS = {
  provider: notificationsCoreNotificationEmailTemplatesRenderers,
  task: notificationsCoreNotificationEmailTemplatesRenderersTask,
};
