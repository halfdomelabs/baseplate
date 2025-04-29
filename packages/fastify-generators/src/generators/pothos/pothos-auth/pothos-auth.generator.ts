import type { TypescriptCodeExpression } from '@halfdomelabs/core-generators';

import {
  projectScope,
  TsCodeUtils,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { authRolesImportsProvider } from '@src/generators/auth/index.js';
import { errorHandlerServiceProvider } from '@src/generators/core/error-handler-service/error-handler-service.generator.js';

import {
  pothosConfigProvider,
  pothosSchemaProvider,
} from '../pothos/pothos.generator.js';

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
  formatAuthorizeConfig(
    config: PothosAuthorizeConfig,
  ): TypescriptCodeExpression;
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
        authRoles: authRolesImportsProvider,
      },
      run({ pothosConfig, authRoles }) {
        pothosConfig.pothosPlugins.set(
          'pothosAuthorizeByRolesPlugin',
          TsCodeUtils.importFragment(
            'pothosAuthorizeByRolesPlugin',
            pothosAuthPluginPath,
          ),
        );

        pothosConfig.schemaTypeOptions.set(
          'AuthRole',
          authRoles.AuthRole.typeFragment(),
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
        errorHandlerService: errorHandlerServiceProvider,
        typescript: typescriptProvider,
      },
      run({ errorHandlerService, typescript, pothosSchema }) {
        return {
          build: async (builder) => {
            await builder.apply(
              typescript.createCopyFilesAction({
                sourceBaseDirectory: 'FieldAuthorizePlugin',
                destinationBaseDirectory:
                  'src/plugins/graphql/FieldAuthorizePlugin',
                paths: ['global-types.ts', 'index.ts', 'types.ts'],
                importMappers: [errorHandlerService],
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
                TypescriptCodeUtils.createExpression(
                  JSON.stringify(config.roles),
                ),
            },
          },
        };
      },
    }),
  }),
});
