import {
  createNodePackagesTask,
  extractPackageVersions,
  projectScope,
  tsCodeFragment,
  tsImportBuilder,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import {
  appModuleProvider,
  authContextImportsProvider,
  authRolesImportsProvider,
  configServiceImportsProvider,
  configServiceProvider,
  fastifyServerConfigProvider,
  prismaOutputProvider,
  userSessionServiceImportsProvider,
  userSessionTypesImportsProvider,
} from '@halfdomelabs/fastify-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { AUTH0_PACKAGES } from '#src/auth0/constants/packages.js';

import { createAuth0ModuleImports } from './generated/ts-import-maps.js';
import { AUTH_0_AUTH_0_MODULE_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({
  userModelName: z.string().min(1),
  includeManagement: z.boolean().optional(),
});

export const auth0ModuleGenerator = createGenerator({
  name: 'auth0/auth0-module',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ includeManagement, userModelName }) => ({
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
        authRolesImports: authRolesImportsProvider,
        appModule: appModuleProvider,
        configServiceImports: configServiceImportsProvider,
        prismaOutput: prismaOutputProvider,
        userSessionTypesImports: userSessionTypesImportsProvider,
        authContextImports: authContextImportsProvider,
      },
      exports: {
        userSessionServiceImports:
          userSessionServiceImportsProvider.export(projectScope),
      },
      run({
        typescriptFile,
        authRolesImports,
        prismaOutput,
        configServiceImports,
        appModule,
        userSessionTypesImports,
        authContextImports,
      }) {
        const userSessionServicePath = `${appModule.getModuleFolder()}/services/user-session.service.ts`;
        const managementPath = `${appModule.getModuleFolder()}/services/management.ts`;
        return {
          providers: {
            auth0Module: {},
            userSessionServiceImports: createAuth0ModuleImports(
              `${appModule.getModuleFolder()}/services`,
            ),
          },
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: AUTH_0_AUTH_0_MODULE_TS_TEMPLATES.userSessionService,
                destination: userSessionServicePath,
                variables: {
                  TPL_USER_MODEL:
                    prismaOutput.getPrismaModelFragment(userModelName),
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
                  template: AUTH_0_AUTH_0_MODULE_TS_TEMPLATES.management,
                  destination: managementPath,
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
