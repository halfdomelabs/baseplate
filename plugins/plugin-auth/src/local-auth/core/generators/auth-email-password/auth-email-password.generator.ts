import { tsCodeFragment, TsCodeUtils } from '@baseplate-dev/core-generators';
import {
  appModuleProvider,
  configServiceProvider,
  createPothosPrismaObjectTypeOutputName,
  pothosTypeOutputProvider,
} from '@baseplate-dev/fastify-generators';
import { queueConfigProvider } from '@baseplate-dev/plugin-queue';
import {
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@baseplate-dev/sync';
import { quot } from '@baseplate-dev/utils';
import { z } from 'zod';

import { LOCAL_AUTH_MODELS } from '#src/local-auth/constants/model-names.js';

import { LOCAL_AUTH_CORE_AUTH_EMAIL_PASSWORD_GENERATED as GENERATED_TEMPLATES } from './generated/index.js';

const descriptorSchema = z.object({
  adminRoles: z.array(z.string()),
  devWebDomainPort: z.number(),
});

/**
 * Sets up email / password authentication
 */
export const authEmailPasswordGenerator = createGenerator({
  name: 'local-auth/core/auth-email-password',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ adminRoles, devWebDomainPort }) => ({
    paths: GENERATED_TEMPLATES.paths.task,
    imports: GENERATED_TEMPLATES.imports.task,
    renderers: GENERATED_TEMPLATES.renderers.task,
    config: createProviderTask(configServiceProvider, (configService) => {
      configService.configFields.set('AUTH_FRONTEND_URL', {
        validator: tsCodeFragment('z.url()'),
        comment:
          'Frontend URL for authentication flows including password reset and email verification (e.g., https://app.example.com)',
        exampleValue: `http://localhost:${devWebDomainPort}`,
      });
    }),
    appModule: createGeneratorTask({
      dependencies: {
        paths: GENERATED_TEMPLATES.paths.provider,
        appModule: appModuleProvider,
      },
      run({ paths, appModule }) {
        appModule.moduleImports.push(
          paths.schemaUserPasswordMutations,
          paths.schemaPasswordResetMutations,
          paths.schemaEmailVerificationMutations,
        );
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        renderers: GENERATED_TEMPLATES.renderers.provider,
        userObjectType: pothosTypeOutputProvider
          .dependency()
          .reference(
            createPothosPrismaObjectTypeOutputName(LOCAL_AUTH_MODELS.user),
          ),
        queueConfig: queueConfigProvider.dependency().optional(),
      },
      run({ renderers, userObjectType, queueConfig }) {
        return {
          build: async (builder) => {
            await builder.apply(
              renderers.moduleGroup.render({
                variables: {
                  schemaUserPasswordMutations: {
                    TPL_ADMIN_ROLES: TsCodeUtils.mergeFragmentsAsArrayPresorted(
                      adminRoles.map((r) => quot(r)).toSorted(),
                    ),
                    TPL_USER_OBJECT_TYPE:
                      userObjectType.getTypeReference().fragment,
                  },
                },
              }),
            );
            await builder.apply(renderers.servicesEmailVerification.render({}));
            await builder.apply(
              renderers.schemaEmailVerificationMutations.render({}),
            );

            // Render queue only if queue plugin is available
            if (queueConfig) {
              await builder.apply(
                renderers.queuesCleanupAuthVerification.render({}),
              );

              // Register with queue system
              queueConfig.queues.set(
                'cleanup-auth-verification',
                tsCodeFragment('cleanupAuthVerificationQueue'),
              );
            }
          },
        };
      },
    }),
  }),
});
