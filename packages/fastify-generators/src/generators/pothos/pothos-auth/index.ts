import {
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createProviderType,
  createTaskConfigBuilder,
} from '@halfdomelabs/sync';
import { z } from 'zod';
import { authProvider } from '@src/generators/auth/auth/index.js';
import { errorHandlerServiceProvider } from '@src/generators/core/error-handler-service/index.js';
import { pothosSetupProvider } from '../pothos/index.js';

const descriptorSchema = z.object({
  requireOnRootFields: z.boolean().default(true),
});

type Descriptor = z.infer<typeof descriptorSchema>;

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

const createMainTask = createTaskConfigBuilder(
  ({ requireOnRootFields }: Descriptor) => ({
    name: 'main',
    dependencies: {
      pothosSetup: pothosSetupProvider,
      auth: authProvider,
      errorHandlerService: errorHandlerServiceProvider,
      typescript: typescriptProvider,
    },
    run({ pothosSetup, errorHandlerService, typescript, auth }) {
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
                `import { pothosAuthorizeByRolesPlugin } from '@/src/plugins/graphql/FieldAuthorizePlugin';`,
              ),
            )
            .appendUnique('schemaTypeOptions', {
              key: 'AuthRole',
              value: new TypescriptCodeExpression(
                'AuthRole',
                "import { AuthRole } from '%role-service';",
                { importMappers: [auth] },
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
);

const PothosAuthGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createMainTask(descriptor));

    taskBuilder.addTask({
      name: 'auth-formatter',
      exports: {
        pothosAuth: pothosAuthProvider,
      },
      run() {
        return {
          getProviders: () => ({
            pothosAuth: {
              formatAuthorizeConfig: (config) =>
                // TODO: Validate roles
                TypescriptCodeUtils.createExpression(
                  JSON.stringify(config.roles),
                ),
            },
          }),
        };
      },
    });
  },
});

export default PothosAuthGenerator;
