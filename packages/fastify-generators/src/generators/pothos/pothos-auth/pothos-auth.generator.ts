import type { TsCodeFragment } from '@halfdomelabs/core-generators';

import {
  projectScope,
  tsCodeFragment,
  TsCodeUtils,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { authRolesImportsProvider } from '#src/generators/auth/index.js';
import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/error-handler-service.generator.js';

import {
  pothosConfigProvider,
  pothosSchemaProvider,
} from '../pothos/pothos.generator.js';
import { POTHOS_POTHOS_AUTH_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({
  requireOnRootFields: z.boolean().default(true),
});

export const pothosAuthorizeConfigSchema = z.object({
  roles: z.array(z.string().min(1)),
});

export interface PothosAuthorizeConfig {
  roles: string[];
}

export interface PothosAuthProvider {
  formatAuthorizeConfig(config: PothosAuthorizeConfig): TsCodeFragment;
}

export const pothosAuthProvider =
  createProviderType<PothosAuthProvider>('pothos-auth');

const pothosAuthPluginPath =
  '@/src/plugins/graphql/FieldAuthorizePlugin/index.js';

export const pothosAuthGenerator = createGenerator({
  name: 'pothos/pothos-auth',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ requireOnRootFields }) => ({
    pothosConfig: createGeneratorTask({
      dependencies: {
        pothosConfig: pothosConfigProvider,
        authRolesImports: authRolesImportsProvider,
      },
      run({ pothosConfig, authRolesImports }) {
        pothosConfig.pothosPlugins.set(
          'pothosAuthorizeByRolesPlugin',
          TsCodeUtils.importFragment(
            'pothosAuthorizeByRolesPlugin',
            pothosAuthPluginPath,
          ),
        );

        pothosConfig.schemaTypeOptions.set(
          'AuthRole',
          authRolesImports.AuthRole.typeFragment(),
        );

        pothosConfig.schemaBuilderOptions.set(
          'authorizeByRoles',
          TsCodeUtils.mergeFragmentsAsObject({
            requireOnRootFields: requireOnRootFields.toString(),
            extractRoles: '(context) => context.auth.roles',
          }),
        );
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        pothosSchema: pothosSchemaProvider,
        errorHandlerServiceImports: errorHandlerServiceImportsProvider,
        typescriptFile: typescriptFileProvider,
      },
      run({ errorHandlerServiceImports, typescriptFile, pothosSchema }) {
        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateGroup({
                group:
                  POTHOS_POTHOS_AUTH_TS_TEMPLATES.fieldAuthorizePluginGroup,
                baseDirectory: '@/src/plugins/graphql/FieldAuthorizePlugin',
                importMapProviders: {
                  errorHandlerServiceImports,
                },
              }),
            );

            pothosSchema.registerSchemaFile(
              `'@src/plugins/graphql/FieldAuthorizePlugin/index.ts`,
            );
          },
        };
      },
    }),
    authFormatter: createGeneratorTask({
      exports: {
        pothosAuth: pothosAuthProvider.export(projectScope),
      },
      run() {
        return {
          providers: {
            pothosAuth: {
              formatAuthorizeConfig: (config) =>
                // TODO: Validate roles
                tsCodeFragment(JSON.stringify(config.roles)),
            },
          },
        };
      },
    }),
  }),
});
