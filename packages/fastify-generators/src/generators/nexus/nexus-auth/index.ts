import {
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createGeneratorWithChildren,
  createProviderType,
} from '@baseplate/sync';
import { z } from 'zod';
import { authProvider } from '@src/generators/auth/auth';
import { authInfoProvider } from '@src/generators/auth/auth-plugin';
import { errorHandlerServiceProvider } from '@src/generators/core/error-handler-service';
import { requestServiceContextSetupProvider } from '@src/generators/core/request-service-context';
import { serviceContextSetupProvider } from '@src/generators/core/service-context';
import { nexusSetupProvider } from '../nexus';

const descriptorSchema = z.object({
  requireOnRootFields: z.boolean().default(true),
  authInfoRef: z.string().min(1),
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

export const nexusAuthProvider =
  createProviderType<NexusAuthProvider>('nexus-auth');

const NexusAuthGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    nexusSetup: nexusSetupProvider,
    serviceContextSetup: serviceContextSetupProvider,
    requestServiceContextSetup: requestServiceContextSetupProvider,
    auth: authProvider,
    errorHandlerService: errorHandlerServiceProvider,
    typescript: typescriptProvider,
    authInfo: authInfoProvider,
  },
  populateDependencies: (deps, { authInfoRef }) => ({
    ...deps,
    authInfo: deps.authInfo.dependency().reference(authInfoRef),
  }),
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
      authInfo,
      serviceContextSetup,
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

    const authInfoType = TypescriptCodeUtils.createExpression(
      'AuthInfo',
      'import { AuthInfo } from "%auth-info";',
      {
        importMappers: [authInfo],
      }
    );

    serviceContextSetup.addContextField('auth', {
      type: authInfoType,
      value: TypescriptCodeUtils.createExpression('auth'),
      contextArg: [
        {
          name: 'auth',
          type: authInfoType,
          // TODO: Figure out how to allow role service to inject test default here
          testDefault: TypescriptCodeUtils.createExpression(
            'createAuthInfoFromUser(null, ["system"])',
            'import { createAuthInfoFromUser } from "%auth-info";',
            { importMappers: [authInfo] }
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
