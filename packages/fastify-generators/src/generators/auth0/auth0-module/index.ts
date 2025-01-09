import {
  makeImportAndFilePath,
  nodeProvider,
  projectScope,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createProviderType,
  createTaskConfigBuilder,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { authContextProvider } from '@src/generators/auth/auth-context/index.js';
import { authRolesProvider } from '@src/generators/auth/auth-roles/index.js';
import { authSetupProvider } from '@src/generators/auth/auth/index.js';
import { userSessionServiceProvider } from '@src/generators/auth/providers.js';
import { userSessionTypesProvider } from '@src/generators/auth/user-session-types/index.js';
import { configServiceProvider } from '@src/generators/core/config-service/index.js';
import { fastifyServerProvider } from '@src/generators/core/index.js';
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
      authRoles: authRolesProvider,
      node: nodeProvider,
      appModule: appModuleProvider,
      configService: configServiceProvider,
      prismaOutput: prismaOutputProvider,
      authSetup: authSetupProvider,
      userSessionTypes: userSessionTypesProvider,
      authContext: authContextProvider,
    },
    exports: {
      auth0Module: auth0ModuleProvider.export(projectScope),
      userSessionService: userSessionServiceProvider.export(projectScope),
    },
    run({
      node,
      typescript,
      authRoles,
      prismaOutput,
      configService,
      appModule,
      authSetup,
      userSessionTypes,
      authContext,
    }) {
      if (includeManagement) {
        node.addPackages({
          auth0: '4.0.2',
        });
      }

      const [userSessionServiceImport, userSessionServicePath] =
        makeImportAndFilePath(
          `${appModule.getModuleFolder()}/services/user-session.service.ts`,
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

      authSetup.getConfig().set('userSessionServiceImport', {
        path: userSessionServiceImport,
        allowedImports: ['userSessionService'],
      });

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
          userSessionService: {
            getImportMap: () => ({
              '%user-session-service': {
                path: userSessionServiceImport,
                allowedImports: ['userSessionService'],
              },
            }),
          },
        }),
        build: async (builder) => {
          const serviceFile = typescript.createTemplate(
            {
              USER_MODEL: prismaOutput.getPrismaModelExpression(userModelName),
            },
            {
              importMappers: [
                configService,
                authRoles,
                authContext,
                userSessionTypes,
              ],
            },
          );

          await builder.apply(
            serviceFile.renderToAction(
              'services/user-session.service.ts',
              userSessionServicePath,
            ),
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
      name: 'fastifyAuth0Plugin',
      dependencies: {
        node: nodeProvider,
        fastifyServer: fastifyServerProvider,
        configService: configServiceProvider,
      },
      run({ node, fastifyServer, configService }) {
        node.addPackages({
          'fastify-auth0-verify': '3.0.0',
        });

        fastifyServer.registerPlugin({
          name: 'fastifyAuth0Verify',
          plugin: TypescriptCodeUtils.createExpression(
            'fastifyAuth0Verify',
            "import fastifyAuth0Verify from 'fastify-auth0-verify'",
          ),
          options: TypescriptCodeUtils.createExpression(
            `{
    domain: config.AUTH0_DOMAIN,
    audience: config.AUTH0_AUDIENCE,
  }`,
            "import {config} from  '%config';",
            { importMappers: [configService] },
          ),
        });
      },
    });

    taskBuilder.addTask({
      name: 'loggerSetup',
      dependencies: {
        loggerServiceSetup: loggerServiceSetupProvider,
      },
      run({ loggerServiceSetup }) {
        loggerServiceSetup.addMixin(
          'userId',
          TypescriptCodeUtils.createExpression(
            "requestContext.get('userId')",
            "import { requestContext } from '@fastify/request-context';",
          ),
        );
      },
    });
  },
});

export default Auth0ModuleGenerator;
