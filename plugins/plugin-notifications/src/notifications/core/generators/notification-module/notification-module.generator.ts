import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { tsCodeFragment, TsCodeUtils } from '@baseplate-dev/core-generators';
import {
  appModuleConfigProvider,
  appModuleFieldTypesProvider,
  appModuleProvider,
  appRuntimeConfigProvider,
  pothosSchemaProvider,
  pothosTypeOutputProvider,
  prismaOutputProvider,
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
  /** The app's user model; delivery reads recipient addresses from it. */
  userModelName: z.string(),
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
  buildTasks: ({ includeEmailChannel, userModelName }) => ({
    paths: NOTIFICATIONS_CORE_NOTIFICATION_MODULE_GENERATED.paths.task,
    renderers: NOTIFICATIONS_CORE_NOTIFICATION_MODULE_GENERATED.renderers.task,
    appRuntimeConfig: createGeneratorTask({
      dependencies: {
        appRuntimeConfig: appRuntimeConfigProvider,
        paths: NOTIFICATIONS_CORE_NOTIFICATION_MODULE_GENERATED.paths.provider,
      },
      run({ appRuntimeConfig, paths }) {
        appRuntimeConfig.services.set(
          'notification',
          TsCodeUtils.typeImportFragment(
            'NotificationService',
            paths.servicesNotificationService,
          ),
        );
        appRuntimeConfig.services.set(
          'notificationEvents',
          TsCodeUtils.typeImportFragment(
            'NotificationEvents',
            paths.servicesNotificationEvents,
          ),
        );
        appRuntimeConfig.flattenedModuleFields.set(
          'notificationTypes',
          'notificationTypes',
        );

        // Each channel factory owns its own deps; assembly happens here (the
        // composition root), not inside the service. Keyed by channel so the
        // registry is the installed subset of `installedChannelKeys`, never a
        // separately-branched list.
        // Reused wherever a renderer is needed; each use renders its own
        // `createNotificationRenderer(...)` call rather than a shared binding.
        const rendererFragment = TsCodeUtils.template`${TsCodeUtils.importFragment('createNotificationRenderer', paths.servicesNotificationRenderer)}({ notificationTypes })`;

        const channelFactories: Record<string, TsCodeFragment> = {
          inApp: TsCodeUtils.template`${TsCodeUtils.importFragment('createInAppChannel', paths.servicesInAppChannel)}({ events: notificationEvents })`,
          // Takes the renderer: the email channel renders at DELIVERY time, so
          // a copy fix reaches any email that has not gone out yet.
          email: TsCodeUtils.template`${TsCodeUtils.importFragment('createEmailChannel', paths.servicesEmailChannel)}({ email, renderer: ${rendererFragment} })`,
        };
        const channelEntries = Object.fromEntries(
          installedChannelKeys(includeEmailChannel ?? false).map((key) => [
            key,
            channelFactories[key],
          ]),
        );

        // Its own entry rather than inlined: both `notifications` and the
        // in-app channel read the same emitter, and inlining would construct
        // two.
        appRuntimeConfig.construction.set('notificationEvents', {
          dependencies: ['pubsub'],
          fragment: TsCodeUtils.template`${TsCodeUtils.importFragment('createNotificationEvents', paths.servicesNotificationEvents)}(pubsub)`,
        });
        // The renderer is constructed inline rather than as its own entry:
        // only the service and its channels consume it, and it holds no
        // resource to dispose.
        appRuntimeConfig.construction.set('notification', {
          dependencies: [
            'notificationEvents',
            // The outbox hands delivery to the queue, so the service cannot be
            // constructed before it.
            'queue',
            ...(includeEmailChannel ? ['email'] : []),
          ],
          fragment: TsCodeUtils.template`${TsCodeUtils.importFragment('createNotificationService', paths.servicesNotificationService)}({
              events: notificationEvents,
              renderer: ${rendererFragment},
              channels: ${TsCodeUtils.mergeFragmentsAsObject(channelEntries)},
              queue,
            })`,
        });
      },
    }),
    // Declared without a type here and bound below, once `paths` can be
    // resolved (the element type lives inside this module).
    appModuleConfig: createGeneratorTask({
      dependencies: {
        appModuleConfig: appModuleConfigProvider,
      },
      run({ appModuleConfig }) {
        appModuleConfig.moduleFields.set('notificationTypes', undefined);
      },
    }),
    appModuleFieldTypes: createGeneratorTask({
      dependencies: {
        appModuleFieldTypes: appModuleFieldTypesProvider,
        paths: NOTIFICATIONS_CORE_NOTIFICATION_MODULE_GENERATED.paths.provider,
      },
      run({ appModuleFieldTypes, paths }) {
        appModuleFieldTypes.setFieldType(
          'notificationTypes',
          TsCodeUtils.typeImportFragment(
            'NotificationTypeDefinition',
            paths.servicesNotificationRegistry,
          ),
        );
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
          .reference(
            `prisma-object-type:${NOTIFICATION_MODELS.notificationFeedItem}`,
          ),
        // Delivery resolves recipient addresses itself, so it needs the app's
        // user delegate — the model name is configurable.
        prismaOutput: prismaOutputProvider,
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
        prismaOutput,
        transactionalLibConfig,
      }) {
        const { schemaGroup } =
          NOTIFICATIONS_CORE_NOTIFICATION_MODULE_GENERATED.templates;
        for (const template of Object.keys(schemaGroup)) {
          const renderedPath = paths[template as keyof typeof schemaGroup];
          appModule.moduleImports.push(renderedPath);
          pothosSchema.registerSchemaFile(renderedPath);
        }

        // Bind both workers so the app's queue runtime starts them. The
        // delivery worker drains the outbox; the sweep worker re-drives
        // deliveries whose enqueue failed after the transaction committed.
        for (const worker of [
          [
            'notificationDeliveryWorker',
            paths.queuesNotificationDeliveryWorker,
          ],
          [
            'notificationOutboxSweepWorker',
            paths.queuesNotificationOutboxSweepWorker,
          ],
        ] as const) {
          appModule.moduleFields.set(
            'queues',
            worker[0],
            TsCodeUtils.importFragment(worker[0], worker[1]),
          );
        }

        // Contribute the built-in `generic` type (backing `notifyText`) as a
        // module declaration; the runtime collects it into the per-runtime
        // registry at construction — no import-time side effect.
        appModule.moduleFields.set(
          'notificationTypes',
          'generic',
          TsCodeUtils.importFragment(
            'GENERIC_NOTIFICATION_TYPE',
            paths.servicesGenericType,
          ),
        );

        // The module publishes unseen-count changes over the GraphQL pubsub,
        // which only exists when the backend app enables subscriptions. Fail
        // with a clear message instead of a confusing missing-`getPubSub` error.
        if (!yogaPluginConfig.isSubscriptionEnabled()) {
          throw new Error(
            'The notifications plugin requires GraphQL subscriptions. Enable subscriptions on the backend app that hosts the notifications feature.',
          );
        }

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
                  servicesNotificationService: {
                    TPL_USER_DELEGATE:
                      prismaOutput.getPrismaModelFragment(userModelName),
                  },
                },
              }),
            );

            await builder.apply(renderers.queuesGroup.render({}));

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
