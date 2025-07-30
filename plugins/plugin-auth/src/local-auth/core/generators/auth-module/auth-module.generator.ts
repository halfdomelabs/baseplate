import { tsCodeFragment } from '@baseplate-dev/core-generators';
import {
  appModuleProvider,
  configServiceProvider,
  createPothosPrismaObjectTypeOutputName,
  pothosTypeOutputProvider,
  prismaOutputProvider,
} from '@baseplate-dev/fastify-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { LOCAL_AUTH_CORE_AUTH_MODULE_GENERATED as GENERATED_TEMPLATES } from './generated/index.js';

const descriptorSchema = z.object({
  userSessionModelName: z.string().min(1),
  userModelName: z.string().min(1),
});

export const authModuleGenerator = createGenerator({
  name: 'local-auth/core/auth-module',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ userSessionModelName, userModelName }) => ({
    paths: GENERATED_TEMPLATES.paths.task,
    imports: GENERATED_TEMPLATES.imports.task,
    renderers: GENERATED_TEMPLATES.renderers.task,
    config: createProviderTask(configServiceProvider, (configService) => {
      configService.configFields.set('AUTH_SECRET', {
        validator: tsCodeFragment(
          'z.string().regex(/^[a-zA-Z0-9-_+=/]{20,}$/)',
        ),
        comment:
          'Secret key for signing auth cookie (at least 20 alphanumeric characters)',
        seedValue: 'a-secret-key-1234567890',
        exampleValue: '<AUTH_SECRET>',
      });
    }),
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
        );
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        prismaOutput: prismaOutputProvider,
        renderers: GENERATED_TEMPLATES.renderers.provider,
        userObjectType: pothosTypeOutputProvider
          .dependency()
          .reference(createPothosPrismaObjectTypeOutputName(userModelName)),
      },
      run({ prismaOutput, renderers, userObjectType }) {
        return {
          providers: {
            authModule: {},
          },
          build: async (builder) => {
            await builder.apply(
              renderers.userSessionService.render({
                variables: {
                  TPL_PRISMA_USER_SESSION:
                    prismaOutput.getPrismaModelFragment(userSessionModelName),
                },
              }),
            );
            await builder.apply(renderers.constantsGroup.render({}));
            await builder.apply(renderers.utilsGroup.render({}));
            await builder.apply(
              renderers.moduleGroup.render({
                variables: {
                  schemaUserSessionPayloadObjectType: {
                    TPL_PRISMA_USER:
                      prismaOutput.getPrismaModelFragment(userModelName),
                    TPL_USER_OBJECT_TYPE:
                      userObjectType.getTypeReference().fragment,
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
