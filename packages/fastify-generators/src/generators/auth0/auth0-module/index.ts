import {
  makeImportAndFilePath,
  nodeProvider,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createGeneratorWithChildren,
  createProviderType,
} from '@baseplate/sync';
import { z } from 'zod';
import { authInfoImportProvider } from '@src/generators/auth/auth-service';
import { roleServiceProvider } from '@src/generators/auth/role-service';
import { configServiceProvider } from '@src/generators/core/config-service';
import { errorHandlerServiceProvider } from '@src/generators/core/error-handler-service';
import { appModuleProvider } from '@src/generators/core/root-module';
import { prismaOutputProvider } from '@src/generators/prisma/prisma';

const descriptorSchema = z.object({
  userModelName: z.string().min(1),
  includeManagement: z.boolean().optional(),
});

export type Auth0ModuleProvider = unknown;

export const auth0ModuleProvider =
  createProviderType<Auth0ModuleProvider>('auth0-module');

const Auth0ModuleGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
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
  },
  createGenerator(
    { userModelName, includeManagement },
    {
      node,
      typescript,
      roleService,
      prismaOutput,
      configService,
      appModule,
      errorHandlerService,
    }
  ) {
    node.addPackages({
      'fastify-auth0-verify': '0.8.0',
      '@fastify/request-context': '4.0.0',
    });

    if (includeManagement) {
      node.addPackages({
        auth0: '2.42.0',
      });
      node.addDevPackages({
        '@types/auth0': '2.35.2',
      });
    }

    const [pluginImport, pluginPath] = makeImportAndFilePath(
      `${appModule.getModuleFolder()}/plugins/auth0-plugin.ts`
    );

    const [, authServicePath] = makeImportAndFilePath(
      `${appModule.getModuleFolder()}/services/auth-service.ts`
    );

    const [authInfoImport, authInfoPath] = makeImportAndFilePath(
      `${appModule.getModuleFolder()}/utils/auth-info.ts`
    );

    appModule.registerFieldEntry(
      'plugins',
      TypescriptCodeUtils.createExpression(
        'auth0Plugin',
        `import {auth0Plugin} from '${pluginImport}'`
      )
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
      `${appModule.getModuleFolder()}/services/management.ts`
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
      }),
      build: async (builder) => {
        const pluginFile = typescript.createTemplate(
          {},
          { importMappers: [configService] }
        );

        await builder.apply(
          pluginFile.renderToAction('plugins/auth0-plugin.ts', pluginPath)
        );

        const serviceFile = typescript.createTemplate(
          {
            USER_MODEL: prismaOutput.getPrismaModelExpression(userModelName),
            AUTH_ROLE_SERVICE: roleService.getServiceExpression(),
          },
          { importMappers: [configService, roleService] }
        );

        await builder.apply(
          serviceFile.renderToAction(
            'services/auth-service.ts',
            authServicePath
          )
        );

        const authInfoFile = typescript.createTemplate(
          {},
          { importMappers: [roleService, errorHandlerService] }
        );

        await builder.apply(
          authInfoFile.renderToAction('utils/auth-info.ts', authInfoPath)
        );

        if (includeManagement) {
          await builder.apply(
            typescript.createCopyAction({
              source: 'services/management.ts',
              destination: managementPath,
              importMappers: [configService],
            })
          );
        }
      },
    };
  },
});

export default Auth0ModuleGenerator;
