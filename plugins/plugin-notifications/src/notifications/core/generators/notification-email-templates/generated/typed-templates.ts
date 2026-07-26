import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import { transactionalLibImportsProvider } from '@baseplate-dev/plugin-email';
import path from 'node:path';

const notificationEmail = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    transactionalLibImports: transactionalLibImportsProvider,
  },
  name: 'notification-email',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/emails/notifications/notification.email.tsx',
    ),
  },
  variables: {},
});

export const NOTIFICATIONS_CORE_NOTIFICATION_EMAIL_TEMPLATES_TEMPLATES = {
  notificationEmail,
};
