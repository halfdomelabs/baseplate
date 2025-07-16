import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  packageScope,
  tsCodeFragment,
  TsCodeUtils,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { authRolesImportsProvider } from '#src/generators/auth/index.js';

import { pothosConfigProvider, pothosSchemaProvider } from '../pothos/index.js';
import { POTHOS_POTHOS_AUTH_GENERATED } from './generated/index.js';

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
    paths: POTHOS_POTHOS_AUTH_GENERATED.paths.task,
    renderers: POTHOS_POTHOS_AUTH_GENERATED.renderers.task,
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
        renderers: POTHOS_POTHOS_AUTH_GENERATED.renderers.provider,
      },
      run({ pothosSchema, renderers }) {
        return {
          build: async (builder) => {
            await builder.apply(renderers.fieldAuthorizePluginGroup.render({}));

            pothosSchema.registerSchemaFile(
              `'@src/plugins/graphql/FieldAuthorizePlugin/index.ts`,
            );
          },
        };
      },
    }),
    authFormatter: createGeneratorTask({
      exports: {
        pothosAuth: pothosAuthProvider.export(packageScope),
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
