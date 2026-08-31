import {
  tsCodeFragment,
  TsCodeUtils,
  tsTypeImportBuilder,
} from '@baseplate-dev/core-generators';
import {
  appModuleProvider,
  appRuntimeConfigProvider,
  createPothosPrismaObjectTypeOutputName,
  pothosTypeOutputProvider,
  prismaOutputProvider,
} from '@baseplate-dev/fastify-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { quot } from '@baseplate-dev/utils';
import { z } from 'zod';

import { LOCAL_AUTH_MODELS } from '#src/local-auth/constants/model-names.js';

import { LOCAL_AUTH_CORE_AUTH_MODULE_GENERATED as GENERATED_TEMPLATES } from './generated/index.js';

const descriptorSchema = z.object({
  userAdminRoles: z.array(z.string()).default([]),
  emailOtp: z.boolean().default(false),
});

export const authModuleGenerator = createGenerator({
  name: 'local-auth/core/auth-module',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ userAdminRoles, emailOtp }) => ({
    paths: GENERATED_TEMPLATES.paths.task,
    imports: GENERATED_TEMPLATES.imports.task,
    renderers: GENERATED_TEMPLATES.renderers.task,
    appModule: createGeneratorTask({
      dependencies: {
        paths: GENERATED_TEMPLATES.paths.provider,
        appModule: appModuleProvider,
      },
      run({ paths, appModule }) {
        appModule.moduleImports.push(
          paths.schemaUserSessionMutations,
          paths.schemaUserSessionQueries,
          paths.schemaUserSessionPayloadObjectType,
          paths.userRolesMutations,
          paths.authRoleEnum,
        );
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        prismaOutput: prismaOutputProvider,
        renderers: GENERATED_TEMPLATES.renderers.provider,
        userObjectType: pothosTypeOutputProvider
          .dependency()
          .reference(
            createPothosPrismaObjectTypeOutputName(LOCAL_AUTH_MODELS.user),
          ),
        appModule: appModuleProvider,
        paths: GENERATED_TEMPLATES.paths.provider,
      },
      run({ prismaOutput, renderers, userObjectType, appModule, paths }) {
        return {
          providers: {
            authModule: {},
          },
          build: async (builder) => {
            await builder.apply(
              renderers.userSessionService.render({
                variables: {
                  TPL_PRISMA_USER_SESSION: prismaOutput.getPrismaModelFragment(
                    LOCAL_AUTH_MODELS.userSession,
                  ),
                },
              }),
            );
            await builder.apply(renderers.servicesAuthVerification.render({}));
            if (emailOtp) {
              await builder.apply(
                renderers.servicesCodeVerification.render({}),
              );
            }
            await builder.apply(renderers.constantsGroup.render({}));
            await builder.apply(renderers.utilsGroup.render({}));
            await builder.apply(
              renderers.moduleGroup.render({
                variables: {
                  schemaUserSessionPayloadObjectType: {
                    TPL_PRISMA_USER: prismaOutput.getPrismaModelFragment(
                      LOCAL_AUTH_MODELS.user,
                    ),
                    TPL_USER_OBJECT_TYPE:
                      userObjectType.getTypeReference().fragment,
                  },
                  schemaUserSessionQueries: {
                    TPL_USER_OBJECT_TYPE:
                      userObjectType.getTypeReference().fragment,
                  },
                  userRolesMutations: {
                    TPL_ADMIN_ROLES: TsCodeUtils.mergeFragmentsAsArrayPresorted(
                      userAdminRoles.map(quot).toSorted(),
                    ),
                    TPL_USER_OBJECT_TYPE:
                      userObjectType.getTypeReference().fragment,
                  },
                },
              }),
            );
            // Render queue
            await builder.apply(
              renderers.queuesCleanupAuthVerification.render({}),
            );
            await builder.apply(
              renderers.queuesCleanupAuthVerificationWorker.render({}),
            );

            // Register with the app module's queues field
            appModule.moduleFields.set(
              'queues',
              'cleanupAuthVerificationWorker',
              TsCodeUtils.importFragment(
                'cleanupAuthVerificationWorker',
                paths.queuesCleanupAuthVerificationWorker,
              ),
            );
          },
        };
      },
    }),
    appRuntimeConfig: createGeneratorTask({
      dependencies: {
        appRuntimeConfig: appRuntimeConfigProvider,
        paths: GENERATED_TEMPLATES.paths.provider,
      },
      run({ appRuntimeConfig, paths }) {
        appRuntimeConfig.services.set('userSession', {
          type: tsCodeFragment(
            'CookieUserSessionService',
            tsTypeImportBuilder(['CookieUserSessionService']).from(
              paths.userSessionService,
            ),
          ),
        });
        appRuntimeConfig.construction.set('userSession', {
          fragment: TsCodeUtils.template`new ${TsCodeUtils.importFragment('CookieUserSessionService', paths.userSessionService)}()`,
        });
      },
    }),
  }),
});
