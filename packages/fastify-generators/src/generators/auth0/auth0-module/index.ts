import {
  makeImportAndFilePath,
  nodeProvider,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createProviderType,
  createTaskConfigBuilder,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import {
  authInfoImportProvider,
  authServiceImportProvider,
} from '@src/generators/auth/auth-service/index.js';
import { roleServiceProvider } from '@src/generators/auth/role-service/index.js';
import { configServiceProvider } from '@src/generators/core/config-service/index.js';
import { errorHandlerServiceProvider } from '@src/generators/core/error-handler-service/index.js';
import { loggerServiceSetupProvider } from '@src/generators/core/logger-service/index.js';
import { appModuleProvider } from '@src/generators/core/root-module/index.js';
import { prismaOutputProvider } from '@src/generators/prisma/prisma/index.js';

const descriptorSchema = z.object({
  userModelName: z.string().min(1),
  includeManagement: z.boolean().optional(),
});

type Descriptor = z.infer<typeof descriptorSchema>;

export type Auth0ModuleProvider = unknown;

export const auth0ModuleProvider =
  createProviderType<Auth0ModuleProvider>('auth0-module');

const createMainTask = createTaskConfigBuilder(
  ({ userModelName, includeManagement }: Descriptor) => ({
    name: 'main',
    dependencies: {
      typescript: typescriptProvider,
      roleService: roleServiceProvider,
      node: nodeProvider,
      appModule: appModuleProvider,
      configService: configServiceProvider,
      prismaOutput: prismaOutputProvider,
      errorHandlerService: errorHandlerServiceProvider,
    },
    exports: {
      auth0Module: auth0ModuleProvider,
      authInfoImport: authInfoImportProvider,
      authServiceImport: authServiceImportProvider,
    },
    run({
      node,
      typescript,
      roleService,
      prismaOutput,
      configService,
      appModule,
      errorHandlerService,
    }) {
      node.addPackages({
        'fastify-auth0-verify': '3.0.0',
        '@fastify/request-context': '6.0.1',
      });

      if (includeManagement) {
        node.addPackages({
          auth0: '4.0.2',
        });
      }

      const [pluginImport, pluginPath] = makeImportAndFilePath(
        `${appModule.getModuleFolder()}/plugins/auth0-plugin.ts`,
      );

      const [authServiceImport, authServicePath] = makeImportAndFilePath(
        `${appModule.getModuleFolder()}/services/auth-service.ts`,
      );

      const [authInfoImport, authInfoPath] = makeImportAndFilePath(
        `${appModule.getModuleFolder()}/utils/auth-info.ts`,
      );

      appModule.registerFieldEntry(
        'plugins',
        TypescriptCodeUtils.createExpression(
          'auth0Plugin',
          `import {auth0Plugin} from '${pluginImport}'`,
        ),
      );

      configService.getConfigEntries().set('AUTH0_DOMAIN', {
        value: TypescriptCodeUtils.createExpression('z.string().min(1)'),
        comment: 'Auth0 domain (can be custom domain)',
        seedValue: 'subdomain.auth0.com',
        exampleValue: '<AUTH0_DOMAIN>',
      });

      configService.getConfigEntries().set('AUTH0_AUDIENCE', {
        value: TypescriptCodeUtils.createExpression('z.string().min(1)'),
        comment: 'Auth0 audience',
        seedValue: 'https://api.example.com',
        exampleValue: '<AUTH0_AUDIENCE>',
      });

      const [, managementPath] = makeImportAndFilePath(
        `${appModule.getModuleFolder()}/services/management.ts`,
      );

      if (includeManagement) {
        configService.getConfigEntries().set('AUTH0_TENANT_DOMAIN', {
          value: TypescriptCodeUtils.createExpression('z.string().min(1)'),
          comment:
            'Auth0 tenant domain (ends with auth0.com), e.g. domain.auth0.com',
          seedValue: 'domain.auth0.com',
          exampleValue: '<AUTH0_TENANT_DOMAIN>',
        });

        configService.getConfigEntries().set('AUTH0_CLIENT_ID', {
          value: TypescriptCodeUtils.createExpression('z.string().min(1)'),
          comment:
            'Auth0 management client ID (https://auth0.com/docs/get-started/auth0-overview/create-applications/machine-to-machine-apps)',
          seedValue: 'CLIENT_ID',
          exampleValue: '<AUTH0_CLIENT_ID>',
        });

        configService.getConfigEntries().set('AUTH0_CLIENT_SECRET', {
          value: TypescriptCodeUtils.createExpression('z.string().min(1)'),
          comment: 'Auth0 management client secret',
          seedValue: 'CLIENT_SECRET',
          exampleValue: '<AUTH0_CLIENT_SECRET>',
        });
      }

      return {
        getProviders: () => ({
          auth0Module: {},
          authInfoImport: {
            getImportMap: () => ({
              '%auth-info': {
                path: authInfoImport,
                allowedImports: [
                  'createAuthInfoFromUser',
                  'UserInfo',
                  'AuthInfo',
                ],
              },
            }),
          },
          authServiceImport: {
            getImportMap: () => ({
              '%auth-service': {
                path: authServiceImport,
                allowedImports: [
                  'createAuthInfoFromRequest',
                  'createAuthInfoFromAuthorization',
                ],
              },
            }),
            getAuthInfoCreator(request, token) {
              return TypescriptCodeUtils.formatExpression(
                `await createAuthInfoFromAuthorization(REQUEST, TOKEN)`,
                { REQUEST: request, TOKEN: token },
                {
                  importText: [
                    `import { createAuthInfoFromAuthorization } from '${authServiceImport}'`,
                  ],
                },
              );
            },
          },
        }),
        build: async (builder) => {
          const pluginFile = typescript.createTemplate(
            {},
            { importMappers: [configService] },
          );

          await builder.apply(
            pluginFile.renderToAction('plugins/auth0-plugin.ts', pluginPath),
          );

          const serviceFile = typescript.createTemplate(
            {
              USER_MODEL: prismaOutput.getPrismaModelExpression(userModelName),
            },
            { importMappers: [configService, roleService] },
          );

          await builder.apply(
            serviceFile.renderToAction(
              'services/auth-service.ts',
              authServicePath,
            ),
          );

          const authInfoFile = typescript.createTemplate(
            {},
            { importMappers: [roleService, errorHandlerService] },
          );

          await builder.apply(
            authInfoFile.renderToAction('utils/auth-info.ts', authInfoPath),
          );

          if (includeManagement) {
            await builder.apply(
              typescript.createCopyAction({
                source: 'services/management.ts',
                destination: managementPath,
                importMappers: [configService],
              }),
            );
          }
        },
      };
    },
  }),
);

const Auth0ModuleGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createMainTask(descriptor));

    taskBuilder.addTask({
      name: 'loggerSetup',
      dependencies: {
        loggerServiceSetup: loggerServiceSetupProvider,
      },
      run({ loggerServiceSetup }) {
        loggerServiceSetup.addMixin(
          'userId',
          TypescriptCodeUtils.createExpression(
            "requestContext.get('user')?.id",
            "import { requestContext } from '@fastify/request-context';",
          ),
        );
        return {};
      },
    });
  },
});

export default Auth0ModuleGenerator;
