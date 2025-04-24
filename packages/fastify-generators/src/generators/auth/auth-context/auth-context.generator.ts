import type { ImportMap, ImportMapper } from '@halfdomelabs/core-generators';

import {
  projectScope,
  tsCodeFragment,
  TsCodeUtils,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderTask,
  createReadOnlyProviderType,
} from '@halfdomelabs/sync';
import path from 'node:path';
import { z } from 'zod';

import { errorHandlerServiceImportsProvider } from '@src/generators/core/error-handler-service/generated/ts-import-maps.js';
import { appModuleProvider } from '@src/generators/core/index.js';
import { requestServiceContextConfigProvider } from '@src/generators/core/request-service-context/request-service-context.generator.js';
import { serviceContextConfigProvider } from '@src/generators/core/service-context/service-context.generator.js';

import { authRolesImportsProvider } from '../auth-roles/generated/ts-import-maps.js';
import { authConfigProvider } from '../auth/auth.generator.js';
import {
  authContextImportsProvider,
  createAuthContextImports,
} from './generated/ts-import-maps.js';
import { AUTH_AUTH_CONTEXT_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({});

export type AuthContextProvider = ImportMapper;

export const authContextProvider =
  createReadOnlyProviderType<AuthContextProvider>('auth-context');

export const authContextGenerator = createGenerator({
  name: 'auth/auth-context',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    requestServiceContextConfig: createProviderTask(
      requestServiceContextConfigProvider,
      (requestServiceContextConfig) => {
        requestServiceContextConfig.contextPassthroughs.set('auth', {
          name: 'auth',
          creator: (req) => tsCodeFragment(`${req}.auth`),
        });
      },
    ),
    main: createGeneratorTask({
      dependencies: {
        serviceContextConfig: serviceContextConfigProvider,
        authRolesImports: authRolesImportsProvider,
        appModule: appModuleProvider,
        typescriptFile: typescriptFileProvider,
        errorHandlerServiceImports: errorHandlerServiceImportsProvider,
        authConfig: authConfigProvider,
      },
      exports: {
        authContext: authContextProvider.export(projectScope),
        authContextImports: authContextImportsProvider.export(projectScope),
      },
      run({
        serviceContextConfig,
        appModule,
        typescriptFile,
        errorHandlerServiceImports,
        authRolesImports,
      }) {
        const authContextTypesFile = path.join(
          appModule.getModuleFolder(),
          'types/auth-context.types.ts',
        );
        const authSessionTypesFile = path.join(
          appModule.getModuleFolder(),
          'types/auth-session.types.ts',
        );
        const authContextUtilsFile = path.join(
          appModule.getModuleFolder(),
          'utils/auth-context.utils.ts',
        );

        const importMap: ImportMap = {
          '%auth-context/types': {
            path: authContextTypesFile,
            allowedImports: ['AuthContext'],
          },
          '%auth-context/session-types': {
            path: authSessionTypesFile,
            allowedImports: ['AuthSessionInfo', 'AuthUserSessionInfo'],
          },
          '%auth-context/utils': {
            path: authContextUtilsFile,
            allowedImports: ['createAuthContextFromSessionInfo'],
          },
        };

        const authContextImports = createAuthContextImports(
          appModule.getModuleFolder(),
        );

        return {
          providers: {
            authContext: {
              getImportMap: () => importMap,
            },
            authContextImports,
          },
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateGroup({
                group: AUTH_AUTH_CONTEXT_TS_TEMPLATES.mainGroup,
                baseDirectory: appModule.getModuleFolder(),
                importMapProviders: {
                  authRolesImports,
                  errorHandlerServiceImports,
                },
              }),
            );

            serviceContextConfig.contextFields.set('auth', {
              type: authContextImports.AuthContext.typeFragment(),
              setter: 'auth',
              creatorArguments: [
                {
                  name: 'auth',
                  type: authContextImports.AuthContext.typeFragment(),
                  testDefault: TsCodeUtils.template`${authContextImports.createAuthContextFromSessionInfo.fragment()}(undefined)`,
                },
              ],
            });
          },
        };
      },
    }),
  }),
});

export { authContextImportsProvider } from './generated/ts-import-maps.js';
