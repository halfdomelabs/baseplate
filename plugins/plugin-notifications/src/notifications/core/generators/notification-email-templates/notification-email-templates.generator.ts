import { emailTemplatesProvider } from '@baseplate-dev/plugin-email';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { NOTIFICATIONS_CORE_NOTIFICATION_EMAIL_TEMPLATES_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

/**
 * Renders the notification email component into the transactional library and
 * registers its export. Sibling of the transactional-lib generator (shares
 * packageScope), pushed only when the email plugin is enabled.
 */
export const notificationEmailTemplatesGenerator = createGenerator({
  name: 'notifications/core/notification-email-templates',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: NOTIFICATIONS_CORE_NOTIFICATION_EMAIL_TEMPLATES_GENERATED.paths.task,
    renderers:
      NOTIFICATIONS_CORE_NOTIFICATION_EMAIL_TEMPLATES_GENERATED.renderers.task,
    main: createGeneratorTask({
      dependencies: {
        emailTemplates: emailTemplatesProvider,
        paths:
          NOTIFICATIONS_CORE_NOTIFICATION_EMAIL_TEMPLATES_GENERATED.paths
            .provider,
        renderers:
          NOTIFICATIONS_CORE_NOTIFICATION_EMAIL_TEMPLATES_GENERATED.renderers
            .provider,
      },
      run({ emailTemplates, paths, renderers }) {
        emailTemplates.registerExport({
          exportName: 'NotificationEmail',
          exportPath: paths.notificationEmail,
        });

        return {
          build: async (builder) => {
            await builder.apply(renderers.notificationEmail.render({}));
          },
        };
      },
    }),
  }),
});
