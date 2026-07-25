import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  authHooksImportsProvider,
  graphqlImportsProvider,
  reactComponentsImportsProvider,
} from '@baseplate-dev/react-generators';
import path from 'node:path';

const notificationBell = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'notifications',
  importMapProviders: {
    authHooksImports: authHooksImportsProvider,
    graphqlImports: graphqlImportsProvider,
    reactComponentsImports: reactComponentsImportsProvider,
  },
  name: 'notification-bell',
  projectExports: { NotificationBell: {} },
  referencedGeneratorTemplates: {
    notificationOperations: {},
    notificationPanel: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/notifications/notification-bell.tsx',
    ),
  },
  variables: {},
});

const notificationOperations = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'notifications',
  importMapProviders: { graphqlImports: graphqlImportsProvider },
  name: 'notification-operations',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/notifications/notification-operations.ts',
    ),
  },
  variables: {},
});

const notificationPanel = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'notifications',
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
  },
  name: 'notification-panel',
  referencedGeneratorTemplates: { notificationOperations: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/notifications/notification-panel.tsx',
    ),
  },
  variables: {},
});

export const notificationsGroup = {
  notificationBell,
  notificationOperations,
  notificationPanel,
};

export const NOTIFICATIONS_CORE_NOTIFICATION_WEB_TEMPLATES = {
  notificationsGroup,
};
