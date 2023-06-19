import {
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithChildren,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';
import { authProvider } from '@src/generators/auth/auth/index.js';
import { errorHandlerServiceProvider } from '@src/generators/core/error-handler-service/index.js';
import { requestServiceContextSetupProvider } from '@src/generators/core/request-service-context/index.js';
import { nexusSetupProvider } from '../nexus/index.js';

const descriptorSchema = z.object({
  requireOnRootFields: z.boolean().default(true),
});

export const authorizeConfigSchema = z.object({
  roles: z.array(z.string().min(1)),
});

export interface AuthorizeConfig {
  roles: string[];
}

export interface NexusAuthProvider {
  formatAuthorizeConfig(config: AuthorizeConfig): TypescriptCodeExpression;
}

export const nexusAuthProvider = createProviderType<NexusAuthProvider>(
  'nexus-auth',
  { isReadOnly: true }
);

const NexusAuthGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    nexusSetup: nexusSetupProvider,
    requestServiceContextSetup: requestServiceContextSetupProvider,
    auth: authProvider,
    errorHandlerService: errorHandlerServiceProvider,
    typescript: typescriptProvider,
  },
  exports: {
    nexusAuth: nexusAuthProvider,
  },
  createGenerator(
    { requireOnRootFields },
    {
      nexusSetup,
      errorHandlerService,
      typescript,
      auth,
      requestServiceContextSetup,
    }
  ) {
    const nexusAuthorizePluginFile = typescript.createTemplate(
      {
        MODULE_FILE: { type: 'code-expression' },
      },
      {
        importMappers: [
          auth,
          errorHandlerService,
          nexusSetup,
          requestServiceContextSetup,
        ],
      }
    );

    // TODO: Figure out how to resolve this properly
    nexusAuthorizePluginFile.addCodeEntries({
      MODULE_FILE: `'@src/plugins/graphql/nexus-authorize-role'`,
    });

    nexusSetup.registerSchemaFile(
      `'@src/plugins/graphql/nexus-authorize-role.ts`
    );

    const args = requireOnRootFields
      ? JSON.stringify({ requireOnRootFields: true })
      : '';

    nexusSetup
      .getConfig()
      .appendUnique('nexusPlugins', [
        TypescriptCodeUtils.createExpression(
          `fieldAuthorizeRolePlugin(${args})`,
          `import { fieldAuthorizeRolePlugin } from '@/src/plugins/graphql/nexus-authorize-role';`
        ),
      ])
      .appendUnique('mutationFields', [
        {
          name: 'authorize',
          isOptional: true,
          type: new TypescriptCodeExpression(
            "FieldAuthorizeRoleResolver<'Mutation', FieldName>",
            "import { FieldAuthorizeRoleResolver } from '@/src/plugins/graphql/nexus-authorize-role';"
          ),
        },
      ]);

    return {
      getProviders: () => ({
        nexusAuth: {
          formatAuthorizeConfig: (config) =>
            // TODO: Validate roles
            TypescriptCodeUtils.createExpression(JSON.stringify(config.roles)),
        },
      }),
      build: async (builder) => {
        await builder.apply(
          nexusAuthorizePluginFile.renderToAction(
            'plugins/nexus-authorize-role.ts',
            'src/plugins/graphql/nexus-authorize-role.ts'
          )
        );
      },
    };
  },
});

export default NexusAuthGenerator;
