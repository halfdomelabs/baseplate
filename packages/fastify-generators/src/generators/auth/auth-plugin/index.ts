import {
  copyTypescriptFileAction,
  TypescriptCodeExpression,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
} from '@baseplate/sync';
import * as yup from 'yup';
import { errorHandlerServiceProvider } from '@src/generators/core/error-handler-service';
import { appModuleProvider } from '@src/generators/core/root-module';
import { prismaOutputProvider } from '@src/generators/prisma/prisma';
import { authServiceProvider } from '../auth-service';

const descriptorSchema = yup.object({
  userModelName: yup.string().required(),
});

export type AuthPluginProvider = unknown;

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
    const authPluginFile = typescript.createTemplate({
      AUTH_SERVICE: { type: 'code-expression' },
      USER_TYPE: { type: 'code-expression' },
      UNAUTHORIZED_ERROR: { type: 'code-expression' },
    });
    authPluginFile.addCodeEntries({
      AUTH_SERVICE: authService.getServiceExpression(),
      USER_TYPE: prismaOutput.getModelTypeExpression(userModelName),
      UNAUTHORIZED_ERROR: errorHandler.getHttpErrorExpression('unauthorized'),
    });
    appModule.registerFieldEntry(
      'plugins',
      new TypescriptCodeExpression(
        'authPlugin',
        `import {authPlugin} from '@/${appModule.getModuleFolder()}/plugins/auth-plugin'`
      )
    );
    return {
      getProviders: () => ({
        authPlugin: {},
      }),
      build: async (builder) => {
        builder.setBaseDirectory(appModule.getModuleFolder());
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
