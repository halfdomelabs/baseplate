import { tsCodeFragment } from '@baseplate-dev/core-generators';
import {
  appModuleProvider,
  pothosSchemaProvider,
  pothosTypeOutputProvider,
  yogaPluginConfigProvider,
} from '@baseplate-dev/fastify-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { NOTIFICATION_MODELS } from '#src/notifications/constants/model-names.js';

import { NOTIFICATIONS_CORE_NOTIFICATION_MODULE_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

/**
 * Generates the native notification backend module: the render-at-read services,
 * the GraphQL schema (object-type field, queries, mutations, subscriptions), and
 * the real-time pubsub channels.
 */
export const notificationModuleGenerator = createGenerator({
  name: 'notifications/core/notification-module',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: NOTIFICATIONS_CORE_NOTIFICATION_MODULE_GENERATED.paths.task,
    renderers: NOTIFICATIONS_CORE_NOTIFICATION_MODULE_GENERATED.renderers.task,
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
      },
      run({
        appModule,
        renderers,
        pothosSchema,
        yogaPluginConfig,
        notificationObjectType,
        paths,
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

        // Contribute the real-time channels to the pubsub type map.
        yogaPluginConfig.publishArgs.set(
          'notificationReceived',
          tsCodeFragment(
            '[userId: string, payload: { notificationId: string }]',
          ),
        );
        yogaPluginConfig.publishArgs.set(
          'unreadCountChanged',
          tsCodeFragment('[userId: string, payload: { count: number }]'),
        );

        return {
          build: async (builder) => {
            const objectTypeFragment =
              notificationObjectType.getTypeReference().fragment;

            await builder.apply(renderers.mainGroup.render({ variables: {} }));

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
