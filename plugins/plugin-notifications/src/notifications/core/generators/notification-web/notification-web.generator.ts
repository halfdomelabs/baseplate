import {
  tsImportBuilder,
  tsTemplateWithImports,
} from '@baseplate-dev/core-generators';
import { adminLayoutHeaderActionContainerProvider } from '@baseplate-dev/react-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { NOTIFICATIONS_CORE_NOTIFICATION_WEB_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

/**
 * Generates the notification bell/panel widget and mounts it into the admin
 * layout header via the header-actions extension point.
 */
export const notificationWebGenerator = createGenerator({
  name: 'notifications/core/notification-web',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: NOTIFICATIONS_CORE_NOTIFICATION_WEB_GENERATED.paths.task,
    renderers: NOTIFICATIONS_CORE_NOTIFICATION_WEB_GENERATED.renderers.task,
    main: createGeneratorTask({
      dependencies: {
        renderers:
          NOTIFICATIONS_CORE_NOTIFICATION_WEB_GENERATED.renderers.provider,
        paths: NOTIFICATIONS_CORE_NOTIFICATION_WEB_GENERATED.paths.provider,
        adminLayoutHeaderActionContainer:
          adminLayoutHeaderActionContainerProvider,
      },
      run({ renderers, paths, adminLayoutHeaderActionContainer }) {
        adminLayoutHeaderActionContainer.addAction({
          name: 'notification-bell',
          order: 0,
          content: tsTemplateWithImports([
            tsImportBuilder(['NotificationBell']).from(paths.notificationBell),
          ])`<NotificationBell />`,
        });

        return {
          build: async (builder) => {
            await builder.apply(
              renderers.notificationsGroup.render({ variables: {} }),
            );
          },
        };
      },
    }),
  }),
});
