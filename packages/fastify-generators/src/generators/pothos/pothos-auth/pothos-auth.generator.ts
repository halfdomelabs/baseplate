import {
  projectScope,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { authRolesProvider } from '@src/generators/auth/index.js';
import { errorHandlerServiceProvider } from '@src/generators/core/error-handler-service/error-handler-service.generator.js';

import { pothosSetupProvider } from '../pothos/pothos.generator.js';

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

export const pothosAuthGenerator = createGenerator({
  name: 'pothos/pothos-auth',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ requireOnRootFields }) => ({
    main: createGeneratorTask({
      dependencies: {
        pothosSetup: pothosSetupProvider,
        errorHandlerService: errorHandlerServiceProvider,
        typescript: typescriptProvider,
        authRoles: authRolesProvider,
      },
      run({ pothosSetup, errorHandlerService, typescript, authRoles }) {
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

            pothosSetup.registerSchemaFile(
              `'@src/plugins/graphql/FieldAuthorizePlugin/index.ts`,
            );

            pothosSetup
              .getConfig()
              .appendUnique(
                'pothosPlugins',
                TypescriptCodeUtils.createExpression(
                  `pothosAuthorizeByRolesPlugin`,
                  `import { pothosAuthorizeByRolesPlugin } from '@/src/plugins/graphql/FieldAuthorizePlugin/index.js';`,
                ),
              )
              .appendUnique('schemaTypeOptions', {
                key: 'AuthRole',
                value: new TypescriptCodeExpression(
                  'AuthRole',
                  "import { AuthRole } from '%auth-roles';",
                  { importMappers: [authRoles] },
                ),
              })
              .append('schemaBuilderOptions', {
                key: 'authorizeByRoles',
                value: TypescriptCodeUtils.mergeExpressionsAsObject({
                  requireOnRootFields: requireOnRootFields.toString(),
                  extractRoles: '(context) => context.auth.roles',
                }),
              });
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
