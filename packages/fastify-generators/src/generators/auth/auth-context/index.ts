import type { ImportMap, ImportMapper } from '@halfdomelabs/core-generators';

import {
  makeImportAndFilePath,
  projectScope,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import { createGenerator, createProviderType } from '@halfdomelabs/sync';
import { z } from 'zod';

import {
  appModuleProvider,
  errorHandlerServiceProvider,
} from '@src/generators/core/index.js';
import { requestServiceContextSetupProvider } from '@src/generators/core/request-service-context/index.js';
import { serviceContextSetupProvider } from '@src/generators/core/service-context/index.js';

import { authRolesProvider } from '../auth-roles/index.js';
import { authConfigProvider } from '../auth/index.js';

const descriptorSchema = z.object({});

export type AuthContextProvider = ImportMapper;

export const authContextProvider =
  createProviderType<AuthContextProvider>('auth-context');

export const authContextGenerator = createGenerator({
  name: 'auth/auth-context',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks(taskBuilder) {
    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        serviceContextSetup: serviceContextSetupProvider,
        requestServiceContextSetup: requestServiceContextSetupProvider,
        authRoles: authRolesProvider,
        appModule: appModuleProvider,
        typescript: typescriptProvider,
        errorHandlerService: errorHandlerServiceProvider,
        authConfig: authConfigProvider,
      },
      exports: {
        authContext: authContextProvider.export(projectScope),
      },
      run({
        serviceContextSetup,
        requestServiceContextSetup,
        appModule,
        typescript,
        errorHandlerService,
        authRoles,
        authConfig,
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

        authConfig.contextUtilsImport.set(
          {
            path: authContextUtilsImport,
            allowedImports: ['createAuthContextFromSessionInfo'],
          },
          'auth/auth-context',
        );

        return {
          providers: {
            authContext: {
              getImportMap: () => importMap,
            },
          },
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
    });
  },
});
