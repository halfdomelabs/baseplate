import {
  ImportMap,
  ImportMapper,
  makeImportAndFilePath,
  nodeProvider,
  TypescriptCodeBlock,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createNonOverwriteableMap,
  createProviderType,
} from '@halfdomelabs/sync';
import * as R from 'ramda';
import { z } from 'zod';
import { configServiceProvider } from '@src/generators/core/config-service/index.js';
import { errorHandlerServiceProvider } from '@src/generators/core/error-handler-service/index.js';
import { appModuleProvider } from '@src/generators/core/root-module/index.js';
import { prismaOutputProvider } from '@src/generators/prisma/prisma/index.js';
import { notEmpty } from '@src/utils/array.js';
import { quot } from '@src/utils/string.js';
import { authSetupProvider } from '../auth/index.js';

const descriptorSchema = z.object({
  accessTokenExpiry: z.string().default('1h'),
  refreshTokenExpiry: z.string().default('30d'),
  userModelName: z.string().min(1),
  userModelIdField: z.string().default('id'),
});

export type AuthServiceProvider = ImportMapper;

export const authServiceProvider =
  createProviderType<AuthServiceProvider>('auth-service');

export interface AuthServiceImportProvider extends ImportMapper {
  getAuthInfoCreator(
    request: TypescriptCodeExpression,
    token: TypescriptCodeExpression
  ): TypescriptCodeExpression;
}

export const authServiceImportProvider =
  createProviderType<AuthServiceImportProvider>('auth-service-import', {
    isReadOnly: true,
  });

interface AuthField {
  key: string;
  value: TypescriptCodeExpression;
  type: TypescriptCodeExpression;
  creatorBody?: TypescriptCodeBlock;
  extraCreateArgs?: {
    name: string;
    type: TypescriptCodeExpression;
  }[];
}

export interface AuthInfoProvider extends ImportMapper {
  registerAuthField(field: AuthField): void;
}

export const authInfoProvider =
  createProviderType<AuthInfoProvider>('auth-info');

export type AuthInfoImportProvider = ImportMapper;

export const authInfoImportProvider =
  createProviderType<AuthInfoImportProvider>('auth-info-import', {
    isReadOnly: true,
  });

const AuthServiceGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(
    taskBuilder,
    { accessTokenExpiry, refreshTokenExpiry, userModelName, userModelIdField }
  ) {
    const authInfoTask = taskBuilder.addTask({
      name: 'authInfo',
      dependencies: {
        node: nodeProvider,
        appModule: appModuleProvider,
        typescript: typescriptProvider,
        errorHandler: errorHandlerServiceProvider,
      },
      exports: {
        authInfo: authInfoProvider,
        authInfoImport: authInfoImportProvider,
      },
      run({ appModule, typescript, errorHandler, node }) {
        node.addPackages({ '@fastify/request-context': '5.0.0' });

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

        const getImportMap = (): ImportMap => ({
          '%auth-info': {
            path: `@/${appModule.getModuleFolder()}/utils/auth-info`,
            allowedImports: ['UserInfo', 'AuthInfo', 'createAuthInfoFromUser'],
          },
        });

        return {
          getProviders: () => ({
            authInfo: {
              registerAuthField(field) {
                authFields.set(field.key, field);
              },
              getImportMap,
            },
            authInfoImport: { getImportMap },
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

            return { authValues };
          },
        };
      },
    });

    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        appModule: appModuleProvider,
        node: nodeProvider,
        errorHandlerService: errorHandlerServiceProvider,
        prismaOutput: prismaOutputProvider,
        typescript: typescriptProvider,
        config: configServiceProvider,
        authSetup: authSetupProvider,
      },
      exports: {
        authService: authServiceProvider,
        authServiceImport: authServiceImportProvider,
      },
      taskDependencies: { authInfo: authInfoTask },
      run(
        {
          appModule,
          node,
          errorHandlerService,
          prismaOutput,
          typescript,
          config,
          authSetup,
        },
        { authInfo: { authValues } }
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
          EXTRA_ARGS: TypescriptCodeUtils.mergeExpressions(
            authValues
              .flatMap((v) => v.extraCreateArgs || [])
              .map((arg) => arg.name),
            ', '
          ),
          AUTH_INFO_CREATOR: TypescriptCodeUtils.mergeBlocks(
            authValues.map((field) => field.creatorBody).filter(notEmpty)
          ),
        });

        authServiceFile.addCodeEntries({
          ACCESS_TOKEN_EXPIRY_TIME: quot(accessTokenExpiry),
          REFRESH_TOKEN_EXPIRY_TIME: quot(refreshTokenExpiry),
          USER_MODEL: prismaOutput.getPrismaModelExpression(userModelName),
          USER_ID_NAME: userModelIdField,
        });

        config.getConfigEntries().set('JWT_SECRET', {
          value: new TypescriptCodeExpression('z.string()'),
          comment: "The secret used to sign JWT's",
          seedValue: 'MyJwtSecretKey',
          exampleValue: 'MyJwtSecretKey',
        });

        authSetup.getConfig().set('userModelName', userModelName);

        const [authServiceImport] = makeImportAndFilePath(
          `${modulePath}/services/auth-service`
        );

        const importMap = {
          '%auth-service': {
            path: authServiceImport,
            allowedImports: [
              'AuthPayload',
              'loginUser',
              'renewToken',
              'getUserInfoFromAuthorization',
              'createAuthInfoFromAuthorization',
              'ACCESS_TOKEN_EXPIRY_SECONDS',
              'REFRESH_TOKEN_EXPIRY_SECONDS',
            ],
          },
          '%jwt-service': {
            path: `@/${modulePath}/services/jwt-service`,
            allowedImports: ['jwtService', 'InvalidTokenError'],
          },
        };

        return {
          getProviders: () => ({
            authService: {
              getImportMap: () => importMap,
            },
            authServiceImport: {
              getImportMap: () => importMap,
              getAuthInfoCreator(request, token) {
                return token.wrap(
                  (t) => `await createAuthInfoFromAuthorization(${t})`,
                  `import { createAuthInfoFromAuthorization } from '${authServiceImport}'`
                );
              },
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

            await builder.apply(
              authServiceFile.renderToAction('services/auth-service.ts')
            );
          },
        };
      },
    });
  },
});

export default AuthServiceGenerator;
