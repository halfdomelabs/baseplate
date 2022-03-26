import {
  ImportMapper,
  nodeProvider,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createGeneratorWithChildren,
  createProviderType,
} from '@baseplate/sync';
import * as yup from 'yup';
import { configServiceProvider } from '@src/generators/core/config-service';
import { errorHandlerServiceProvider } from '@src/generators/core/error-handler-service';
import { appModuleProvider } from '@src/generators/core/root-module';
import { prismaOutputProvider } from '@src/generators/prisma/prisma';
import { quot } from '@src/utils/string';

const descriptorSchema = yup.object({
  accessTokenExpiry: yup.string().default('1h'),
  refreshTokenExpiry: yup.string().default('30d'),
  userModelName: yup.string().required(),
  userModelIdField: yup.string().default('id'),
});

interface CustomUserFromToken {
  type: TypescriptCodeExpression;
  queryParams: Record<string, TypescriptCodeExpression | string>;
}

export interface AuthServiceProvider extends ImportMapper {
  getServiceExpression(): TypescriptCodeExpression;
  setCustomUserFromToken(userInfo: CustomUserFromToken): void;
}

export const authServiceProvider =
  createProviderType<AuthServiceProvider>('auth-service');

const AuthServiceGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    appModule: appModuleProvider,
    node: nodeProvider,
    errorHandlerService: errorHandlerServiceProvider,
    prismaOutput: prismaOutputProvider,
    typescript: typescriptProvider,
    config: configServiceProvider,
  },
  exports: {
    authService: authServiceProvider,
  },
  createGenerator(
    { accessTokenExpiry, refreshTokenExpiry, userModelName, userModelIdField },
    { appModule, node, errorHandlerService, prismaOutput, typescript, config }
  ) {
    const modulePath = appModule.getModuleFolder();

    node.addPackages({
      jsonwebtoken: '^8.5.1',
      ms: '^2.1.3',
    });

    node.addDevPackages({
      '@types/jsonwebtoken': '^8.5.8',
      '@types/ms': '^0.7.31',
    });

    const authServiceFile = typescript.createTemplate({
      USER_TYPE: { type: 'code-expression' },
      ACCESS_TOKEN_EXPIRY_TIME: { type: 'code-expression' },
      REFRESH_TOKEN_EXPIRY_TIME: { type: 'code-expression' },
      USER_MODEL: { type: 'code-expression' },
      USER_ID_NAME: { type: 'code-expression' },
      AUTH_USER: { type: 'code-expression' },
      AUTH_USER_QUERY_PARMS: { type: 'code-expression' },
    });

    authServiceFile.addCodeEntries({
      ACCESS_TOKEN_EXPIRY_TIME: quot(accessTokenExpiry),
      REFRESH_TOKEN_EXPIRY_TIME: quot(refreshTokenExpiry),
      USER_MODEL: prismaOutput.getPrismaModelExpression(userModelName),
      USER_ID_NAME: userModelIdField,
    });

    config.getConfigEntries().set('JWT_SECRET', {
      value: new TypescriptCodeExpression('yup.string().required()'),
      comment: "The secret used to sign JWT's",
      exampleValue: 'MyJwtSecretKey',
    });

    let customUserFromToken: CustomUserFromToken | null = null;

    return {
      getProviders: () => ({
        authService: {
          setCustomUserFromToken: (customUser) => {
            if (customUserFromToken) {
              throw new Error(`Cannot override custom user from token twice`);
            }
            customUserFromToken = customUser;
          },
          getServiceExpression: () =>
            new TypescriptCodeExpression(
              'authService',
              `import { authService } from '@/${modulePath}/services/auth-service'`
            ),
          getImportMap: () => ({
            '%auth-service': {
              path: `@/${modulePath}/services/auth-service`,
              allowedImports: [
                'authService',
                'ACCESS_TOKEN_EXPIRY_SECONDS',
                'REFRESH_TOKEN_EXPIRY_SECONDS',
              ],
            },
            '%jwt-service': {
              path: `@/${modulePath}/services/jwt-service`,
              allowedImports: ['jwtService', 'InvalidTokenError'],
            },
          }),
        },
      }),
      build: async (builder) => {
        builder.setBaseDirectory(modulePath);

        await builder.apply(
          typescript.createCopyAction({
            source: 'services/jwt-service.ts',
            importMappers: [errorHandlerService, config],
          })
        );

        const customUser = customUserFromToken || {
          type: prismaOutput.getModelTypeExpression(userModelName),
          queryParams: {},
        };
        if (customUser.queryParams.where) {
          throw new Error(`Cannot set where clause on custom user`);
        }
        authServiceFile.addCodeEntries({
          AUTH_USER: customUser.type,
          AUTH_USER_QUERY_PARMS: TypescriptCodeUtils.mergeExpressionsAsObject({
            where: `{ ${userModelIdField}: payload.sub }`,
            ...customUser.queryParams,
          }),
        });

        await builder.apply(
          authServiceFile.renderToAction('services/auth-service.ts')
        );
      },
    };
  },
});

export default AuthServiceGenerator;
