import {
  tsCodeFragment,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  appModuleProvider,
  authContextImportsProvider,
  authRolesImportsProvider,
  configServiceImportsProvider,
  configServiceProvider,
  errorHandlerServiceImportsProvider,
  prismaOutputProvider,
  requestServiceContextImportsProvider,
  userSessionTypesImportsProvider,
} from '@baseplate-dev/fastify-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { FASTIFY_AUTH_MODULE_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({
  userSessionModelName: z.string().min(1),
});

export const authModuleGenerator = createGenerator({
  name: 'auth/auth-module',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ userSessionModelName }) => ({
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
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        authRolesImports: authRolesImportsProvider,
        appModule: appModuleProvider,
        configServiceImports: configServiceImportsProvider,
        prismaOutput: prismaOutputProvider,
        userSessionTypesImports: userSessionTypesImportsProvider,
        authContextImports: authContextImportsProvider,
        errorHandlerServiceImports: errorHandlerServiceImportsProvider,
        requestServiceContextImports: requestServiceContextImportsProvider,
      },
      run({
        typescriptFile,
        authRolesImports,
        prismaOutput,
        configServiceImports,
        appModule,
        userSessionTypesImports,
        authContextImports,
        errorHandlerServiceImports,
        requestServiceContextImports,
      }) {
        const userSessionServicePath = `${appModule.getModuleFolder()}/services/user-session.service.ts`;
        return {
          providers: {
            authModule: {},
          },
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template:
                  FASTIFY_AUTH_MODULE_TS_TEMPLATES.servicesUserSessionService,
                destination: userSessionServicePath,
                variables: {
                  TPL_PRISMA_USER_SESSION:
                    prismaOutput.getPrismaModelFragment(userSessionModelName),
                },
                importMapProviders: {
                  configServiceImports,
                  authContextImports,
                  authRolesImports,
                  userSessionTypesImports,
                  errorHandlerServiceImports,
                  requestServiceContextImports,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
