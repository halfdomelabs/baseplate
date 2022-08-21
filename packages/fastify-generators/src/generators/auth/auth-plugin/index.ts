import {
  copyTypescriptFileAction,
  ImportMapper,
  nodeProvider,
  TypescriptCodeBlock,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createGeneratorWithTasks,
  createNonOverwriteableMap,
  createProviderType,
} from '@baseplate/sync';
import R from 'ramda';
import { z } from 'zod';
import { errorHandlerServiceProvider } from '@src/generators/core/error-handler-service';
import { loggerServiceSetupProvider } from '@src/generators/core/logger-service';
import { appModuleProvider } from '@src/generators/core/root-module';
import { prismaOutputProvider } from '@src/generators/prisma/prisma';
import { notEmpty } from '@src/utils/array';
import { authServiceProvider } from '../auth-service';

const descriptorSchema = z.object({
  userModelName: z.string().min(1),
});

interface AuthField {
  key: string;
  value: TypescriptCodeExpression;
  type: TypescriptCodeExpression;
  hookBody?: TypescriptCodeBlock;
  extraCreateArgs?: {
    name: string;
    type: TypescriptCodeExpression;
  }[];
}

export interface AuthPluginProvider extends ImportMapper {
  setCustomAuthUserType(type: TypescriptCodeExpression): void;
  registerAuthField(field: AuthField): void;
}

export const authPluginProvider =
  createProviderType<AuthPluginProvider>('auth-plugin');

export type AuthInfoProvider = ImportMapper;

export const authInfoProvider = createProviderType<AuthInfoProvider>(
  'auth-info',
  { isReadOnly: true }
);

const AuthPluginGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder, { userModelName }) {
    taskBuilder.addTask({
      name: 'logger-request-context',
      dependencies: { loggerServiceSetup: loggerServiceSetupProvider },
      run({ loggerServiceSetup }) {
        loggerServiceSetup.addMixin(
          'userId',
          TypescriptCodeUtils.createExpression(
            "requestContext.get('user')?.id",
            "import { requestContext } from '@fastify/request-context';"
          )
        );

        return {};
      },
    });

    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        node: nodeProvider,
        authService: authServiceProvider,
        appModule: appModuleProvider,
        typescript: typescriptProvider,
        prismaOutput: prismaOutputProvider,
        errorHandler: errorHandlerServiceProvider,
      },
      exports: {
        authPlugin: authPluginProvider,
        authInfo: authInfoProvider,
      },

      run({
        authService,
        appModule,
        typescript,
        prismaOutput,
        errorHandler,
        node,
      }) {
        node.addPackages({ '@fastify/request-context': '4.0.0' });

        const authFields = createNonOverwriteableMap<Record<string, AuthField>>(
          {
            user: {
              key: 'user',
              value: new TypescriptCodeExpression('user'),
              type: TypescriptCodeUtils.createExpression('UserInfo | null'),
            },
            requiredUser: {
              key: 'requiredUser',
              value: TypescriptCodeUtils.createExpression(
                `
() => {
  if (!user) {
    throw new UnauthorizedError('User is required');
  }
  return user;
}
`,
                `import { UnauthorizedError } from '%http-errors';`,
                { importMappers: [errorHandler] }
              ),
              type: TypescriptCodeUtils.createExpression('() => UserInfo'),
            },
          },
          { name: 'auth-field' }
        );
        appModule.registerFieldEntry(
          'plugins',
          new TypescriptCodeExpression(
            'authPlugin',
            `import {authPlugin} from '@/${appModule.getModuleFolder()}/plugins/auth-plugin'`
          )
        );
        let customAuthUserType: TypescriptCodeExpression | null = null;
        return {
          getProviders: () => ({
            authPlugin: {
              setCustomAuthUserType(type) {
                if (customAuthUserType) {
                  throw new Error(
                    'authPlugin.setCustomAuthUserType() can only be called once'
                  );
                }
                customAuthUserType = type;
              },
              registerAuthField(field) {
                authFields.set(field.key, field);
              },
              getImportMap: () => ({
                '%auth-info': {
                  path: `@/${appModule.getModuleFolder()}/utils/auth-info`,
                  allowedImports: [
                    'UserInfo',
                    'AuthInfo',
                    'createAuthInfoFromUser',
                  ],
                },
              }),
            },
            authInfo: {
              getImportMap: () => ({
                '%auth-info': {
                  path: `@/${appModule.getModuleFolder()}/utils/auth-info`,
                  allowedImports: ['AuthInfo', 'createAuthInfoFromUser'],
                },
              }),
            },
          }),
          build: async (builder) => {
            builder.setBaseDirectory(appModule.getModuleFolder());

            const authMap = authFields.value();
            const authValues = Object.values(authMap);

            const authInfoFile = typescript.createTemplate({
              EXTRA_ARGS: TypescriptCodeUtils.mergeExpressions(
                authValues
                  .flatMap((v) => v.extraCreateArgs || [])
                  .map((arg) =>
                    arg.type.wrap((type) => `${arg.name}: ${type}`)
                  ),
                ', '
              ),
              AUTH_TYPE: TypescriptCodeUtils.mergeBlocksAsInterfaceContent(
                R.mapObjIndexed((value) => value.type, authMap)
              ),
              AUTH_OBJECT: TypescriptCodeUtils.mergeExpressionsAsObject(
                R.mapObjIndexed((value) => value.value, authMap)
              ),
            });

            await builder.apply(
              authInfoFile.renderToAction('utils/auth-info.ts')
            );

            const authPluginFile = typescript.createTemplate(
              {
                EXTRA_ARGS: TypescriptCodeUtils.mergeExpressions(
                  authValues
                    .flatMap((v) => v.extraCreateArgs || [])
                    .map((arg) => arg.name),
                  ', '
                ),
                AUTH_USER:
                  customAuthUserType ||
                  prismaOutput.getModelTypeExpression(userModelName),
                HOOK_BODY: TypescriptCodeUtils.mergeBlocks(
                  Object.values(authMap)
                    .map((field) => field.hookBody)
                    .filter(notEmpty)
                ),
              },
              {
                importMappers: [authService],
              }
            );

            await builder.apply(
              authPluginFile.renderToAction('plugins/auth-plugin.ts')
            );

            await builder.apply(
              copyTypescriptFileAction({ source: 'utils/headers.ts' })
            );
          },
        };
      },
    });
  },
});

export default AuthPluginGenerator;
