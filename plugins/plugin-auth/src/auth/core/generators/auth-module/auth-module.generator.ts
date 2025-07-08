import {
  tsCodeFragment,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
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

import { AUTH_CORE_AUTH_MODULE_GENERATED } from './generated';

const descriptorSchema = z.object({
  userSessionModelName: z.string().min(1),
});

export const authModuleGenerator = createGenerator({
  name: 'auth/core/auth-module',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ userSessionModelName }) => ({
    paths: AUTH_CORE_AUTH_MODULE_GENERATED.paths.task,
    imports: AUTH_CORE_AUTH_MODULE_GENERATED.imports.task,
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
        configServiceImports: configServiceImportsProvider,
        prismaOutput: prismaOutputProvider,
        userSessionTypesImports: userSessionTypesImportsProvider,
        authContextImports: authContextImportsProvider,
        errorHandlerServiceImports: errorHandlerServiceImportsProvider,
        requestServiceContextImports: requestServiceContextImportsProvider,
        paths: AUTH_CORE_AUTH_MODULE_GENERATED.paths.provider,
      },
      run({
        typescriptFile,
        authRolesImports,
        prismaOutput,
        configServiceImports,
        userSessionTypesImports,
        authContextImports,
        errorHandlerServiceImports,
        requestServiceContextImports,
        paths,
      }) {
        return {
          providers: {
            authModule: {},
          },
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template:
                  AUTH_CORE_AUTH_MODULE_GENERATED.templates.userSessionService,
                destination: paths.userSessionService,
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
            await builder.apply(
              typescriptFile.renderTemplateGroup({
                group: AUTH_CORE_AUTH_MODULE_GENERATED.templates.constantsGroup,
                paths,
              }),
            );
            await builder.apply(
              typescriptFile.renderTemplateGroup({
                group: AUTH_CORE_AUTH_MODULE_GENERATED.templates.utilsGroup,
                paths,
                importMapProviders: {
                  configServiceImports,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
