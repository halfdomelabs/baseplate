import {
  ImportMapper,
  TypescriptCodeExpression,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
} from '@baseplate/sync';
import * as yup from 'yup';
import { configServiceProvider } from '@src/generators/core/config-service';
import { appModuleProvider } from '@src/generators/core/root-module';
import { serviceContextProvider } from '@src/generators/core/service-context';
import { nexusSchemaProvider } from '@src/generators/nexus/nexus';
import { nexusAuthProvider } from '@src/generators/nexus/nexus-auth';
import { authServiceProvider } from '../auth-service';

const descriptorSchema = yup.object({
  placeholder: yup.string(),
});

export type AuthMutationsProvider = ImportMapper;

export const authMutationsProvider =
  createProviderType<AuthMutationsProvider>('auth-mutations');

const AuthMutationsGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    appModule: appModuleProvider,
    nexusSchema: nexusSchemaProvider,
    authService: authServiceProvider,
    typescript: typescriptProvider,
    configService: configServiceProvider,
    nexusAuth: nexusAuthProvider,
    serviceContext: serviceContextProvider,
  },
  exports: {
    authMutations: authMutationsProvider,
  },
  createGenerator(
    descriptor,
    {
      appModule,
      nexusSchema,
      authService,
      typescript,
      configService,
      nexusAuth,
      serviceContext,
    }
  ) {
    const appModuleFolder = appModule.getModuleFolder();

    const authMutationsFile = typescript.createTemplate(
      {
        AUTHORIZE_USER: { type: 'code-expression' },
        AUTHORIZE_ANONYMOUS: { type: 'code-expression' },
      },
      {
        importMappers: [configService, authService, nexusSchema],
      }
    );

    authMutationsFile.addCodeEntries({
      AUTHORIZE_USER: nexusAuth.formatAuthorizeConfig({ roles: ['user'] }),
      AUTHORIZE_ANONYMOUS: nexusAuth.formatAuthorizeConfig({
        roles: ['anonymous'],
      }),
    });

    nexusSchema.registerSchemaFile(
      `${appModuleFolder}/schema/auth-mutations.ts`
    );
    appModule.registerFieldEntry(
      'schemaTypes',
      new TypescriptCodeExpression(
        'authMutations',
        `import * as authMutations from '@/${appModuleFolder}/schema/auth-mutations'`
      )
    );

    return {
      getProviders: () => ({
        authMutations: {
          getImportMap: () => ({
            '%auth-mutations/refresh-token': {
              path: `@/${appModuleFolder}/utils/refresh-tokens`,
              allowedImports: [
                'REFRESH_TOKEN_COOKIE_NAME',
                'setRefreshTokenIntoCookie',
                'clearRefreshTokenFromCookie',
                'formatRefreshTokens',
              ],
            },
          }),
        },
      }),
      build: async (builder) => {
        builder.setBaseDirectory(appModule.getModuleFolder());

        await builder.apply(
          authMutationsFile.renderToAction('schema/auth-mutations.ts')
        );

        await builder.apply(
          typescript.createCopyAction({
            source: 'utils/refresh-tokens.ts',
            importMappers: [configService, nexusSchema, serviceContext],
          })
        );
      },
    };
  },
});

export default AuthMutationsGenerator;
