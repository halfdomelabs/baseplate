import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { tsCodeFragment, TsCodeUtils } from '@baseplate-dev/core-generators';
import {
  appModuleProvider,
  appRuntimeConfigProvider,
  pothosSchemaProvider,
  pothosTypeOutputProvider,
  yogaPluginConfigProvider,
} from '@baseplate-dev/fastify-generators';
import { transactionalLibConfigProvider } from '@baseplate-dev/plugin-email';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { NOTIFICATION_MODELS } from '#src/notifications/constants/model-names.js';

import { NOTIFICATIONS_CORE_NOTIFICATION_MODULE_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({
  /** Generate the email delivery channel (only when the email plugin is enabled). */
  includeEmailChannel: z.boolean().optional(),
});

/**
 * The installed delivery channels, in registry order. The single source both the
 * generated `NotificationChannels` interface (the compile-time channel-key union)
 * and the composition-root registry render from — so a channel a type lists but
 * the app doesn't install is a compile error, not a runtime miss, and the two
 * renders can't drift.
 */
export function installedChannelKeys(
  includeEmailChannel: boolean,
): readonly string[] {
  return ['inApp', ...(includeEmailChannel ? ['email'] : [])];
}

/**
 * Generates the native notification backend module: the render-at-read services,
 * the GraphQL schema (object-type field, queries, mutations, subscriptions), and
 * the real-time pubsub channels.
 */
export const notificationModuleGenerator = createGenerator({
  name: 'notifications/core/notification-module',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ includeEmailChannel }) => ({
    paths: NOTIFICATIONS_CORE_NOTIFICATION_MODULE_GENERATED.paths.task,
    renderers: NOTIFICATIONS_CORE_NOTIFICATION_MODULE_GENERATED.renderers.task,
    appRuntimeConfig: createGeneratorTask({
      dependencies: {
        appRuntimeConfig: appRuntimeConfigProvider,
        paths: NOTIFICATIONS_CORE_NOTIFICATION_MODULE_GENERATED.paths.provider,
      },
      run({ appRuntimeConfig, paths }) {
        appRuntimeConfig.services.set(
          'notifications',
          TsCodeUtils.typeImportFragment(
            'NotificationService',
            paths.servicesNotificationService,
          ),
        );

        // Each channel factory owns its own deps; assembly happens here (the
        // composition root), not inside the service. Keyed by channel so the
        // registry is the installed subset of `installedChannelKeys`, never a
        // separately-branched list.
        const channelFactories: Record<string, TsCodeFragment> = {
          inApp: TsCodeUtils.template`${TsCodeUtils.importFragment('createInAppChannel', paths.servicesInAppChannel)}({ events: notificationEvents })`,
          email: TsCodeUtils.template`${TsCodeUtils.importFragment('createEmailChannel', paths.servicesEmailChannel)}({ emails })`,
        };
        const channelEntries = Object.fromEntries(
          installedChannelKeys(includeEmailChannel ?? false).map((key) => [
            key,
            channelFactories[key],
          ]),
        );

        appRuntimeConfig.construction.set('notifications', {
          dependencies: ['pubsub', ...(includeEmailChannel ? ['emails'] : [])],
          fragment: TsCodeUtils.template`
            const notificationEvents = ${TsCodeUtils.importFragment('createNotificationEvents', paths.servicesNotificationEvents)}(pubsub);
            const notifications = ${TsCodeUtils.importFragment('createNotificationService', paths.servicesNotificationService)}({
              events: notificationEvents,
              channels: ${TsCodeUtils.mergeFragmentsAsObject(channelEntries)},
            });
          `,
        });
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        appModule: appModuleProvider,
        renderers:
          NOTIFICATIONS_CORE_NOTIFICATION_MODULE_GENERATED.renderers.provider,
        pothosSchema: pothosSchemaProvider,
        yogaPluginConfig: yogaPluginConfigProvider,
        notificationObjectType: pothosTypeOutputProvider
          .dependency()
          .reference(`prisma-object-type:${NOTIFICATION_MODELS.notification}`),
        paths: NOTIFICATIONS_CORE_NOTIFICATION_MODULE_GENERATED.paths.provider,
        // Only needed for the email channel's component import; optional so the
        // module builds when the email plugin isn't enabled.
        transactionalLibConfig: transactionalLibConfigProvider
          .dependency()
          .optional(),
      },
      run({
        appModule,
        renderers,
        pothosSchema,
        yogaPluginConfig,
        notificationObjectType,
        paths,
        transactionalLibConfig,
      }) {
        // Register each schema file with the Pothos builder + the module index.
        const { schemaGroup } =
          NOTIFICATIONS_CORE_NOTIFICATION_MODULE_GENERATED.templates;
        for (const template of Object.keys(schemaGroup)) {
          const renderedPath = paths[template as keyof typeof schemaGroup];
          appModule.moduleImports.push(renderedPath);
          pothosSchema.registerSchemaFile(renderedPath);
        }

        // Import the built-in `generic` type for its side effect (it registers
        // itself on load, backing `notifyText`).
        appModule.moduleImports.push(paths.servicesGenericType);

        // The module publishes unseen-count changes over the GraphQL pubsub,
        // which only exists when the backend app enables subscriptions. Fail
        // with a clear message instead of a confusing missing-`getPubSub` error.
        if (!yogaPluginConfig.isSubscriptionEnabled()) {
          throw new Error(
            'The notifications plugin requires GraphQL subscriptions. Enable subscriptions on the backend app that hosts the notifications feature.',
          );
        }

        // Contribute the real-time channel to the pubsub type map.
        yogaPluginConfig.publishArgs.set(
          'notificationsChanged',
          tsCodeFragment('[userId: string, payload: { count: number }]'),
        );

        // One interface member per installed channel — rendered from the same
        // source as the composition-root registry, so the two can't drift.
        const channelEntries = installedChannelKeys(
          includeEmailChannel ?? false,
        )
          .map((key) => `readonly ${key}: NotificationChannel;`)
          .join('\n');

        return {
          build: async (builder) => {
            const objectTypeFragment =
              notificationObjectType.getTypeReference().fragment;

            await builder.apply(
              renderers.mainGroup.render({
                variables: {
                  servicesNotificationChannel: {
                    TPL_CHANNEL_ENTRIES: tsCodeFragment(channelEntries),
                  },
                },
              }),
            );

            if (includeEmailChannel) {
              if (!transactionalLibConfig) {
                throw new Error(
                  'The notifications email channel requires the transactional email library. Enable the email plugin.',
                );
              }
              await builder.apply(
                renderers.servicesEmailChannel.render({
                  variables: {
                    TPL_NOTIFICATION_EMAIL: TsCodeUtils.importFragment(
                      'NotificationEmail',
                      transactionalLibConfig.getTransactionalLibPackageName(),
                    ),
                  },
                }),
              );
            }

            await builder.apply(
              renderers.schemaGroup.render({
                variables: {
                  schemaNotificationContentField: {
                    TPL_NOTIFICATION_OBJECT_TYPE: objectTypeFragment,
                  },
                  schemaNotificationMutations: {
                    TPL_NOTIFICATION_OBJECT_TYPE: objectTypeFragment,
                  },
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
