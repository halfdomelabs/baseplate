import { tsCodeFragment, TsCodeUtils } from '@baseplate-dev/core-generators';
import {
  appModuleConfigProvider,
  appModuleFieldTypesProvider,
  appModuleProvider,
  appRuntimeConfigProvider,
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
        appRuntimeConfig.flattenedModuleFields.set(
          'notificationTypes',
          'notificationTypes',
        );
        appRuntimeConfig.construction.set('notifications', {
          dependencies: ['pubsub'],
          fragment: TsCodeUtils.template`
            const notifications = ${TsCodeUtils.importFragment('createNotificationService', paths.servicesNotificationService)}({
              events: ${TsCodeUtils.importFragment('createNotificationEvents', paths.servicesNotificationEvents)}(pubsub),
              notificationTypes,
            });
          `,
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

        // Contribute the real-time channel to the pubsub type map.
        yogaPluginConfig.publishArgs.set(
          'notificationsChanged',
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
