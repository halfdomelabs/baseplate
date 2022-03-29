import {
  copyTypescriptFileAction,
  ImportMapper,
  TypescriptCodeBlock,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
  createNonOverwriteableMap,
} from '@baseplate/sync';
import R from 'ramda';
import * as yup from 'yup';
import { errorHandlerServiceProvider } from '@src/generators/core/error-handler-service';
import { appModuleProvider } from '@src/generators/core/root-module';
import { prismaOutputProvider } from '@src/generators/prisma/prisma';
import { notEmpty } from '@src/utils/array';
import { authServiceProvider } from '../auth-service';

const descriptorSchema = yup.object({
  userModelName: yup.string().required(),
});

interface AuthField {
  key: string;
  value: TypescriptCodeExpression;
  type: TypescriptCodeExpression;
  hookBody?: TypescriptCodeBlock;
}

export interface AuthPluginProvider extends ImportMapper {
  setCustomAuthUserType(type: TypescriptCodeExpression): void;
  registerAuthField(field: AuthField): void;
}

export const authPluginProvider =
  createProviderType<AuthPluginProvider>('auth-plugin');

const AuthPluginGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    authService: authServiceProvider,
    appModule: appModuleProvider,
    typescript: typescriptProvider,
    prismaOutput: prismaOutputProvider,
    errorHandler: errorHandlerServiceProvider,
  },
  exports: {
    authPlugin: authPluginProvider,
  },
  createGenerator(
    { userModelName },
    { authService, appModule, typescript, prismaOutput, errorHandler }
  ) {
    const authFields = createNonOverwriteableMap<Record<string, AuthField>>(
      {
        user: {
          key: 'user',
          value: new TypescriptCodeExpression('user'),
          type: prismaOutput
            .getModelTypeExpression(userModelName)
            .append(' | null'),
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
          type: prismaOutput
            .getModelTypeExpression(userModelName)
            .wrap((contents) => `() => ${contents}`),
        },
      },
      { name: 'auth-field' }
    );
    const authPluginFile = typescript.createTemplate(
      {
        AUTH_USER: { type: 'code-expression' },
        HOOK_BODY: { type: 'code-block' },
        AUTH_OBJECT: { type: 'code-expression' },
        AUTH_TYPE: { type: 'code-block' },
      },
      {
        importMappers: [authService],
      }
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
            '%auth-plugin': {
              path: `@/${appModule.getModuleFolder()}/plugins/auth-plugin`,
              allowedImports: ['AuthInfo'],
            },
          }),
        },
      }),
      build: async (builder) => {
        builder.setBaseDirectory(appModule.getModuleFolder());

        const authMap = authFields.value();

        authPluginFile.addCodeEntries({
          AUTH_USER:
            customAuthUserType ||
            prismaOutput.getModelTypeExpression(userModelName),
          HOOK_BODY: TypescriptCodeUtils.mergeBlocks(
            Object.values(authMap)
              .map((field) => field.hookBody)
              .filter(notEmpty)
          ),
          AUTH_TYPE: TypescriptCodeUtils.mergeBlocksAsInterfaceContent(
            R.mapObjIndexed((value) => value.type, authMap)
          ),
          AUTH_OBJECT: TypescriptCodeUtils.mergeExpressionsAsObject(
            R.mapObjIndexed((value) => value.value, authMap)
          ),
        });

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

export default AuthPluginGenerator;
