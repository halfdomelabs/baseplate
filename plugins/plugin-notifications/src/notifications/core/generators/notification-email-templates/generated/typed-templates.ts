import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import { transactionalLibImportsProvider } from '@baseplate-dev/plugin-email';
import path from 'node:path';

const notificationDigestEmail = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    transactionalLibImports: transactionalLibImportsProvider,
  },
  name: 'notification-digest-email',
  referencedGeneratorTemplates: { notificationSegmentView: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/emails/notifications/notification-digest.email.tsx',
    ),
  },
  variables: {},
});

const notificationEmail = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    transactionalLibImports: transactionalLibImportsProvider,
  },
  name: 'notification-email',
  referencedGeneratorTemplates: { notificationSegmentView: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/emails/notifications/notification.email.tsx',
    ),
  },
  variables: {},
});

const notificationSegmentView = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    transactionalLibImports: transactionalLibImportsProvider,
  },
  name: 'notification-segment-view',
  projectExports: {
    NotificationEmailSegment: { isTypeOnly: true },
    SegmentsView: { isTypeOnly: false },
    SegmentView: { isTypeOnly: false },
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/emails/notifications/segment-view.tsx',
    ),
  },
  variables: {},
});

export const NOTIFICATIONS_CORE_NOTIFICATION_EMAIL_TEMPLATES_TEMPLATES = {
  notificationDigestEmail,
  notificationEmail,
  notificationSegmentView,
};
