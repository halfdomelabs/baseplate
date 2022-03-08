import {
  nodeProvider,
  TypescriptCodeExpression,
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

export interface AuthServiceProvider {
  getServiceExpression(): TypescriptCodeExpression;
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
    });

    node.addDevPackages({
      '@types/jsonwebtoken': '^8.5.8',
    });

    const authServiceFile = typescript.createTemplate({
      USER_TYPE: { type: 'code-expression' },
      ACCESS_TOKEN_EXPIRY_TIME: { type: 'code-expression' },
      REFRESH_TOKEN_EXPIRY_TIME: { type: 'code-expression' },
      USER_MODEL: { type: 'code-expression' },
      USER_ID_NAME: { type: 'code-expression' },
    });

    authServiceFile.addCodeEntries({
      USER_TYPE: prismaOutput.getModelTypeExpression(userModelName),
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

    return {
      getProviders: () => ({
        authService: {
          getServiceExpression: () =>
            new TypescriptCodeExpression(
              'authService',
              `import { authService } from '@/${modulePath}/services/auth-service'`
            ),
        },
      }),
      build: async (builder) => {
        builder.setBaseDirectory(modulePath);
        const jwtServiceFile = typescript.createTemplate({
          UNAUTHORIZED_ERROR: { type: 'code-expression' },
          CONFIG: { type: 'code-expression' },
        });
        jwtServiceFile.addCodeEntries({
          UNAUTHORIZED_ERROR: new TypescriptCodeExpression(
            'UnauthorizedError',
            `import { UnauthorizedError } from '${errorHandlerService.getHttpErrorsImport()}'`
          ),
          CONFIG: config.getConfigExpression(),
        });

        await builder.apply(
          jwtServiceFile.renderToAction('services/jwt-service.ts')
        );

        await builder.apply(
          authServiceFile.renderToAction('services/auth-service.ts')
        );
      },
    };
  },
});

export default AuthServiceGenerator;
