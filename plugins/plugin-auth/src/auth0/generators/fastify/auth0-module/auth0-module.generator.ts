import {
  createNodePackagesTask,
  extractPackageVersions,
  tsCodeFragment,
  tsImportBuilder,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  authContextImportsProvider,
  authRolesImportsProvider,
  configServiceImportsProvider,
  configServiceProvider,
  fastifyServerConfigProvider,
  prismaOutputProvider,
  userSessionTypesImportsProvider,
} from '@baseplate-dev/fastify-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { AUTH0_MODELS } from '#src/auth0/constants/model-names.js';
import { AUTH0_PACKAGES } from '#src/auth0/constants/packages.js';

import { AUTH0_AUTH0_MODULE_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({
  includeManagement: z.boolean().optional(),
});

export const auth0ModuleGenerator = createGenerator({
  name: 'auth0/auth0-module',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ includeManagement }) => ({
    paths: AUTH0_AUTH0_MODULE_GENERATED.paths.task,
    imports: AUTH0_AUTH0_MODULE_GENERATED.imports.task,
    nodeManagementPackage: includeManagement
      ? createNodePackagesTask({
          prod: extractPackageVersions(AUTH0_PACKAGES, ['auth0']),
        })
      : undefined,
    config: createProviderTask(configServiceProvider, (configService) => {
      configService.configFields.set('AUTH0_DOMAIN', {
        validator: tsCodeFragment('z.string().min(1)'),
        comment: 'Auth0 domain (can be custom domain)',
        seedValue: 'subdomain.auth0.com',
        exampleValue: '<AUTH0_DOMAIN>',
      });

      configService.configFields.set('AUTH0_AUDIENCE', {
        validator: tsCodeFragment('z.string().min(1)'),
        comment: 'Auth0 audience',
        seedValue: 'https://api.example.com',
        exampleValue: '<AUTH0_AUDIENCE>',
      });

      if (includeManagement) {
        configService.configFields.set('AUTH0_TENANT_DOMAIN', {
          validator: tsCodeFragment('z.string().min(1)'),
          comment:
            'Auth0 tenant domain (ends with auth0.com), e.g. domain.auth0.com',
          seedValue: 'domain.auth0.com',
          exampleValue: '<AUTH0_TENANT_DOMAIN>',
        });

        configService.configFields.set('AUTH0_CLIENT_ID', {
          validator: tsCodeFragment('z.string().min(1)'),
          comment:
            'Auth0 management client ID (https://auth0.com/docs/get-started/auth0-overview/create-applications/machine-to-machine-apps)',
          seedValue: 'CLIENT_ID',
          exampleValue: '<AUTH0_CLIENT_ID>',
        });

        configService.configFields.set('AUTH0_CLIENT_SECRET', {
          validator: tsCodeFragment('z.string().min(1)'),
          comment: 'Auth0 management client secret',
          seedValue: 'CLIENT_SECRET',
          exampleValue: '<AUTH0_CLIENT_SECRET>',
        });
      }
    }),
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        paths: AUTH0_AUTH0_MODULE_GENERATED.paths.provider,
        authRolesImports: authRolesImportsProvider,
        configServiceImports: configServiceImportsProvider,
        prismaOutput: prismaOutputProvider,
        userSessionTypesImports: userSessionTypesImportsProvider,
        authContextImports: authContextImportsProvider,
      },
      run({
        typescriptFile,
        paths,
        authRolesImports,
        prismaOutput,
        configServiceImports,
        userSessionTypesImports,
        authContextImports,
      }) {
        return {
          providers: {
            auth0Module: {},
          },
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template:
                  AUTH0_AUTH0_MODULE_GENERATED.templates.userSessionService,
                destination: paths.userSessionService,
                variables: {
                  TPL_USER_MODEL: prismaOutput.getPrismaModelFragment(
                    AUTH0_MODELS.user,
                  ),
                },
                importMapProviders: {
                  authContextImports,
                  authRolesImports,
                  userSessionTypesImports,
                },
              }),
            );

            if (includeManagement) {
              await builder.apply(
                typescriptFile.renderTemplateFile({
                  template: AUTH0_AUTH0_MODULE_GENERATED.templates.management,
                  destination: paths.management,
                  importMapProviders: {
                    configServiceImports,
                  },
                }),
              );
            }
          },
        };
      },
    }),
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(AUTH0_PACKAGES, ['fastify-auth0-verify']),
    }),
    fastifyAuth0Plugin: createGeneratorTask({
      dependencies: {
        fastifyServerConfig: fastifyServerConfigProvider,
        configServiceImports: configServiceImportsProvider,
      },
      run({ fastifyServerConfig, configServiceImports }) {
        fastifyServerConfig.plugins.set('fastifyAuth0Verify', {
          plugin: tsCodeFragment(
            'fastifyAuth0Verify',
            tsImportBuilder()
              .default('fastifyAuth0Verify')
              .from('fastify-auth0-verify'),
          ),
          options: tsCodeFragment(
            `{
    domain: config.AUTH0_DOMAIN,
    audience: config.AUTH0_AUDIENCE,
  }`,
            configServiceImports.config.declaration(),
          ),
        });
      },
    }),
  }),
});
