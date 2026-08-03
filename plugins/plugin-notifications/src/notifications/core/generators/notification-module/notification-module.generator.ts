import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  createNodePackagesTask,
  extractPackageVersions,
  tsCodeFragment,
  TsCodeUtils,
} from '@baseplate-dev/core-generators';
import {
  appModuleConfigProvider,
  appModuleFieldTypesProvider,
  appModuleProvider,
  appRuntimeConfigProvider,
  FASTIFY_PACKAGES,
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
  /** The categories notification types are grouped under, from the project definition. */
  categories: z
    .array(
      z.object({
        key: z.string(),
        label: z.string(),
        defaultChannels: z.array(z.string()),
        mandatory: z.boolean(),
      }),
    )
    .min(1),
});

/**
 * The installed OUTBOUND delivery channels, in registry order. The single source
 * both the generated `NotificationChannels` interface (the compile-time
 * channel-key union) and the composition-root registry render from — so a
 * channel a type lists but the app doesn't install is a compile error, not a
 * runtime miss, and the two renders can't drift.
 *
 * In-app is absent by design: it is a routing flag on the row plus a pubsub
 * publish, not a queued delivery, so it has no channel implementation.
 */
export function installedChannelKeys(
  includeEmailChannel: boolean,
): readonly string[] {
  return includeEmailChannel ? ['email'] : [];
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
  buildTasks: ({ includeEmailChannel, userModelName, categories }) => ({
    paths: NOTIFICATIONS_CORE_NOTIFICATION_MODULE_GENERATED.paths.task,
    renderers: NOTIFICATIONS_CORE_NOTIFICATION_MODULE_GENERATED.renderers.task,
    // The service chunks and groups delivery work with es-toolkit; declared
    // here rather than relied on from another generator's contribution.
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(FASTIFY_PACKAGES, ['es-toolkit']),
    }),
    appRuntimeConfig: createGeneratorTask({
      dependencies: {
        appRuntimeConfig: appRuntimeConfigProvider,
        paths: NOTIFICATIONS_CORE_NOTIFICATION_MODULE_GENERATED.paths.provider,
      },
      run({ appRuntimeConfig, paths }) {
        appRuntimeConfig.services.set('notification', {
          type: TsCodeUtils.typeImportFragment(
            'NotificationService',
            paths.servicesNotificationService,
          ),
        });
        // Internal: the delivery and sweep workers name it in
        // `SystemServiceContextWith`, but feature code goes through
        // `notification`.
        appRuntimeConfig.services.set('notificationOutbox', {
          internal: true,
          type: TsCodeUtils.typeImportFragment(
            'NotificationOutbox',
            paths.servicesNotificationOutbox,
          ),
        });
        appRuntimeConfig.flattenedModuleFields.set(
          'notificationTypes',
          'notificationTypes',
        );

        // Each channel factory owns its own deps; assembly happens here (the
        // composition root), not inside the service. Keyed by channel so the
        // registry is the installed subset of `installedChannelKeys`, never a
        // separately-branched list.
        const channelFactories: Record<string, TsCodeFragment> = {
          // Takes the renderer: the email channel renders at DELIVERY time, so
          // a copy fix reaches any email that has not gone out yet.
          email: TsCodeUtils.template`${TsCodeUtils.importFragment('createEmailChannel', paths.servicesEmailChannel)}({ email, renderer: notificationRenderer })`,
        };
        const channelEntries = Object.fromEntries(
          installedChannelKeys(includeEmailChannel ?? false).map((key) => [
            key,
            channelFactories[key],
          ]),
        );

        // Bare: only the notification service consumes it, so it needs no key -
        // but it stays its own const because inlining would construct two.
        appRuntimeConfig.construction.set('notificationEvents', {
          bare: true,
          dependencies: ['pubsub'],
          fragment: TsCodeUtils.template`${TsCodeUtils.importFragment('createNotificationEvents', paths.servicesNotificationEvents)}(pubsub)`,
        });
        // Bare for the same reason, with two consumers rather than one: the
        // service renders at read time and the email channel at delivery time,
        // and both must resolve a type through the same registry.
        appRuntimeConfig.construction.set('notificationRenderer', {
          bare: true,
          dependencies: [],
          fragment: TsCodeUtils.template`${TsCodeUtils.importFragment('createNotificationRenderer', paths.servicesNotificationRenderer)}({ notificationTypes })`,
        });
        // Its own service so the workers are handed it directly: feature code
        // gets `notification`, workers get the outbox.
        appRuntimeConfig.construction.set('notificationOutbox', {
          dependencies: [
            'queue',
            'notificationRenderer',
            ...(includeEmailChannel ? ['email'] : []),
          ],
          fragment: TsCodeUtils.template`${TsCodeUtils.importFragment('createNotificationOutbox', paths.servicesNotificationOutbox)}({
              channels: ${TsCodeUtils.mergeFragmentsAsObject(channelEntries)},
              queue,
            })`,
        });
        appRuntimeConfig.construction.set('notification', {
          dependencies: [
            'notificationEvents',
            'notificationRenderer',
            'notificationOutbox',
          ],
          fragment: TsCodeUtils.template`${TsCodeUtils.importFragment('createNotificationService', paths.servicesNotificationService)}({
              events: notificationEvents,
              renderer: notificationRenderer,
              outbox: notificationOutbox,
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
          .reference(`prisma-object-type:${NOTIFICATION_MODELS.notification}`),
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

        // Bind every worker so the app's queue runtime starts them: delivery
        // sends, the sweep re-runs interrupted fan-outs then audits for
        // deliveries whose jobs were lost, and retention collects rows past
        // their horizon.
        appModule.moduleFields.set(
          'queues',
          'notificationDeliveryWorker',
          TsCodeUtils.importFragment(
            'notificationDeliveryWorker',
            paths.queuesNotificationDeliveryWorker,
          ),
        );
        appModule.moduleFields.set(
          'queues',
          'notificationOutboxSweepWorker',
          TsCodeUtils.importFragment(
            'notificationOutboxSweepWorker',
            paths.queuesNotificationOutboxSweepWorker,
          ),
        );
        appModule.moduleFields.set(
          'queues',
          'notificationRetentionWorker',
          TsCodeUtils.importFragment(
            'notificationRetentionWorker',
            paths.queuesNotificationRetentionWorker,
          ),
        );

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
        const channelKeys = installedChannelKeys(includeEmailChannel ?? false);
        const channelEntries = channelKeys
          .map((key) => `readonly ${key}: NotificationChannel;`)
          .join('\n');

        // The same keys as a runtime list, for APIs that enumerate targets
        // rather than check one. Rendered as the whole array — `'inApp'` always
        // leads, and an app with no outbound channels gets a valid one-element
        // array rather than a dangling comma. `as const` keeps the element type
        // literal so it still satisfies the routing-target union.
        const routingTargets = `[${['inApp', ...channelKeys]
          .map((key) => `'${key}'`)
          .join(', ')}] as const`;

        // `as const` so the key union stays literal — a widened `string[]` would
        // make `NotificationCategoryKey` just `string` and defeat the narrowing.
        const categoriesFragment = `[\n${categories
          .map((category) => JSON.stringify(category, null, 2))
          .join(',\n')},\n] as const`;

        return {
          build: async (builder) => {
            const objectTypeFragment =
              notificationObjectType.getTypeReference().fragment;

            await builder.apply(
              renderers.mainGroup.render({
                variables: {
                  constantsNotificationCategories: {
                    TPL_CATEGORIES: tsCodeFragment(categoriesFragment),
                  },
                  servicesNotificationChannel: {
                    TPL_CHANNEL_ENTRIES: tsCodeFragment(channelEntries),
                    TPL_ROUTING_TARGETS: tsCodeFragment(routingTargets),
                  },
                  // Delivery reads recipient and actor details, so the user
                  // delegate belongs to the outbox, not the service.
                  servicesNotificationOutbox: {
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
