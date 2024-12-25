import type { ImportMap, ImportMapper } from '@halfdomelabs/core-generators';

import {
  makeImportAndFilePath,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createProviderType,
  createTaskConfigBuilder,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import {
  appModuleProvider,
  errorHandlerServiceProvider,
} from '@src/generators/core/index.js';
import { requestServiceContextSetupProvider } from '@src/generators/core/request-service-context/index.js';
import { serviceContextSetupProvider } from '@src/generators/core/service-context/index.js';

import { authRolesProvider } from '../auth-roles/index.js';
import { authSetupProvider } from '../auth/index.js';

const descriptorSchema = z.object({});

export type AuthContextProvider = ImportMapper;

export const authContextProvider =
  createProviderType<AuthContextProvider>('auth-context');

const createMainTask = createTaskConfigBuilder(() => ({
  name: 'main',
  dependencies: {
    serviceContextSetup: serviceContextSetupProvider,
    requestServiceContextSetup: requestServiceContextSetupProvider,
    authRoles: authRolesProvider,
    appModule: appModuleProvider,
    typescript: typescriptProvider,
    errorHandlerService: errorHandlerServiceProvider,
    authSetup: authSetupProvider,
  },
  exports: {
    authContext: authContextProvider,
  },
  run({
    serviceContextSetup,
    requestServiceContextSetup,
    appModule,
    typescript,
    errorHandlerService,
    authRoles,
    authSetup,
  }) {
    const [authContextTypesImport, authContextTypesFile] =
      makeImportAndFilePath(
        appModule.getModuleFolder(),
        'types/auth-context.types.ts',
      );
    const [authSessionTypesImport, authSessionTypesFile] =
      makeImportAndFilePath(
        appModule.getModuleFolder(),
        'types/auth-session.types.ts',
      );
    const [authContextUtilsImport, authContextUtilsFile] =
      makeImportAndFilePath(
        appModule.getModuleFolder(),
        'utils/auth-context.utils.ts',
      );

    const importMap: ImportMap = {
      '%auth-context/types': {
        path: authContextTypesImport,
        allowedImports: ['AuthContext'],
      },
      '%auth-context/session-types': {
        path: authSessionTypesImport,
        allowedImports: ['AuthSessionInfo', 'AuthUserSessionInfo'],
      },
      '%auth-context/utils': {
        path: authContextUtilsImport,
        allowedImports: ['createAuthContextFromSessionInfo'],
      },
    };

    authSetup.getConfig().set('contextUtilsImport', {
      path: authContextUtilsImport,
      allowedImports: ['createAuthContextFromSessionInfo'],
    });

    return {
      getProviders: () => ({
        authContext: {
          getImportMap: () => importMap,
        },
      }),
      build: async (builder) => {
        await builder.apply(
          typescript.createCopyAction({
            source: 'types/auth-context.types.ts',
            destination: authContextTypesFile,
            importMappers: [authRoles],
          }),
        );
        await builder.apply(
          typescript.createCopyAction({
            source: 'types/auth-session.types.ts',
            destination: authSessionTypesFile,
            importMappers: [errorHandlerService, authRoles],
          }),
        );
        await builder.apply(
          typescript.createCopyAction({
            source: 'utils/auth-context.utils.ts',
            destination: authContextUtilsFile,
            importMappers: [errorHandlerService, authRoles],
          }),
        );

        const authContextType = TypescriptCodeUtils.createExpression(
          'AuthContext',
          'import { AuthContext } from "%auth-context/types";',
          {
            importMappers: [{ getImportMap: () => importMap }],
          },
        );

        serviceContextSetup.addContextField('auth', {
          type: authContextType,
          value: TypescriptCodeUtils.createExpression('auth'),
          contextArg: [
            {
              name: 'auth',
              type: authContextType,
              testDefault: TypescriptCodeUtils.createExpression(
                'createAuthContextFromSessionInfo(undefined)',
                'import { createAuthContextFromSessionInfo } from "%auth-context/utils";',
                { importMappers: [{ getImportMap: () => importMap }] },
              ),
            },
          ],
        });

        requestServiceContextSetup.addContextPassthrough({
          name: 'auth',
          creator(req) {
            return TypescriptCodeUtils.createExpression(`${req}.auth`);
          },
        });
      },
    };
  },
}));

const AuthContextGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createMainTask(descriptor));
  },
});

export default AuthContextGenerator;
