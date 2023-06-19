import {
  ImportMapper,
  TypescriptCodeExpression,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithChildren,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';
import { configServiceProvider } from '@src/generators/core/config-service/index.js';
import { requestServiceContextProvider } from '@src/generators/core/request-service-context/index.js';
import { appModuleProvider } from '@src/generators/core/root-module/index.js';
import { nexusSchemaProvider } from '@src/generators/nexus/nexus/index.js';
import { nexusAuthProvider } from '@src/generators/nexus/nexus-auth/index.js';
import { authServiceImportProvider } from '../auth-service/index.js';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

export type AuthMutationsProvider = ImportMapper;

export const authMutationsProvider = createProviderType<AuthMutationsProvider>(
  'auth-mutations',
  { isReadOnly: true }
);

const AuthMutationsGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    appModule: appModuleProvider,
    nexusSchema: nexusSchemaProvider,
    authServiceImport: authServiceImportProvider,
    typescript: typescriptProvider,
    configService: configServiceProvider,
    nexusAuth: nexusAuthProvider,
    requestServiceContext: requestServiceContextProvider,
  },
  exports: {
    authMutations: authMutationsProvider,
  },
  createGenerator(
    descriptor,
    {
      appModule,
      nexusSchema,
      authServiceImport,
      typescript,
      configService,
      nexusAuth,
      requestServiceContext,
    }
  ) {
    const appModuleFolder = appModule.getModuleFolder();

    const authMutationsFile = typescript.createTemplate(
      {
        AUTHORIZE_USER: { type: 'code-expression' },
        AUTHORIZE_ANONYMOUS: { type: 'code-expression' },
      },
      {
        importMappers: [configService, authServiceImport, nexusSchema],
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
            importMappers: [configService, nexusSchema, requestServiceContext],
          })
        );
      },
    };
  },
});

export default AuthMutationsGenerator;
