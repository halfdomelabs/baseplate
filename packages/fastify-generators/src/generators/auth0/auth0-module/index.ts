import {
  makeImportAndFilePath,
  nodeProvider,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
} from '@baseplate/sync';
import { z } from 'zod';
import { authInfoProvider } from '@src/generators/auth/auth-plugin';
import { roleServiceProvider } from '@src/generators/auth/role-service';
import { configServiceProvider } from '@src/generators/core/config-service';
import { errorHandlerServiceProvider } from '@src/generators/core/error-handler-service';
import { appModuleProvider } from '@src/generators/core/root-module';
import { prismaOutputProvider } from '@src/generators/prisma/prisma';

const descriptorSchema = z.object({
  userModelName: z.string().min(1),
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
    authInfo: authInfoProvider,
  },
  createGenerator(
    { userModelName },
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
      'fastify-auth0-verify': '^0.7.4',
    });

    const [pluginImport, pluginPath] = makeImportAndFilePath(
      `${appModule.getModuleFolder()}/plugins/auth0-plugin.ts`
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
      comment: 'Auth0 domain',
      seedValue: 'subdomain.auth0.com',
      exampleValue: '<AUTH0_DOMAIN>',
    });

    configService.getConfigEntries().set('AUTH0_AUDIENCE', {
      value: TypescriptCodeUtils.createExpression('z.string().min(1)'),
      comment: 'Auth0 audience',
      seedValue: 'https://api.example.com',
      exampleValue: '<AUTH0_AUDIENCE>',
    });

    return {
      getProviders: () => ({
        auth0Module: {},
        authInfo: {
          getImportMap: () => ({
            '%auth-info': {
              path: authInfoImport,
              allowedImports: ['createAuthInfoFromUser', 'AuthInfo'],
            },
          }),
        },
      }),
      build: async (builder) => {
        const pluginFile = typescript.createTemplate(
          {
            USER_MODEL: prismaOutput.getPrismaModelExpression(userModelName),
            AUTH_ROLE_SERVICE: roleService.getServiceExpression(),
          },
          { importMappers: [configService, roleService] }
        );

        await builder.apply(
          pluginFile.renderToAction('plugins/auth0-plugin.ts', pluginPath)
        );

        const authInfoFile = typescript.createTemplate(
          {},
          { importMappers: [roleService, errorHandlerService] }
        );

        await builder.apply(
          authInfoFile.renderToAction('utils/auth-info.ts', authInfoPath)
        );
      },
    };
  },
});

export default Auth0ModuleGenerator;
