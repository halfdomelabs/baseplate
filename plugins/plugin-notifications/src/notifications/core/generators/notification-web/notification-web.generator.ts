import {
  tsCodeFragment,
  tsImportBuilder,
  tsTemplateWithImports,
} from '@baseplate-dev/core-generators';
import {
  adminLayoutHeaderActionContainerProvider,
  reactApolloConfigProvider,
} from '@baseplate-dev/react-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { NOTIFICATIONS_CORE_NOTIFICATION_WEB_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

/**
 * Generates the notification bell/panel widget. Auto-mounts into the admin
 * layout header via the header-actions extension point when the app has an
 * admin layout; otherwise the components are generated for manual placement.
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
          adminLayoutHeaderActionContainerProvider.dependency().optional(),
        reactApolloConfig: reactApolloConfigProvider,
      },
      run({
        renderers,
        paths,
        adminLayoutHeaderActionContainer,
        reactApolloConfig,
      }) {
        // Cursor-paginate the feed so a "view all" surface can page with
        // `after` without clobbering the cached page. `keyArgs` is left at its
        // default of `false` since the feed takes no filtering arguments.
        reactApolloConfig.typePolicies.set(
          'Query',
          'notificationFeed',
          tsCodeFragment(
            'relayStylePagination()',
            tsImportBuilder(['relayStylePagination']).from(
              '@apollo/client/utilities',
            ),
          ),
        );

        adminLayoutHeaderActionContainer?.addAction({
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
