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
  loggerServiceConfigProvider,
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

import { AUTH_PACKAGES } from '@src/auth/constants/packages.js';

import { createAuthModuleImports } from './generated/ts-import-maps.js';
import { AUTH_0_AUTH_0_MODULE_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({
  userModelName: z.string().min(1),
  includeManagement: z.boolean().optional(),
});

export const authModuleGenerator = createGenerator({
  name: 'auth/auth-module',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ includeManagement, userModelName }) => ({
    nodeManagementPackage: includeManagement
      ? createNodePackagesTask({
          prod: extractPackageVersions(AUTH_PACKAGES, ['auth']),
        })
      : undefined,
    config: createProviderTask(configServiceProvider, (configService) => {
      configService.configFields.set('AUTH_DOMAIN', {
        validator: tsCodeFragment('z.string().min(1)'),
        comment: 'Auth domain (can be custom domain)',
        seedValue: 'subdomain.auth.com',
        exampleValue: '<AUTH_DOMAIN>',
      });

      configService.configFields.set('AUTH_AUDIENCE', {
        validator: tsCodeFragment('z.string().min(1)'),
        comment: 'Auth audience',
        seedValue: 'https://api.example.com',
        exampleValue: '<AUTH_AUDIENCE>',
      });

      if (includeManagement) {
        configService.configFields.set('AUTH_TENANT_DOMAIN', {
          validator: tsCodeFragment('z.string().min(1)'),
          comment:
            'Auth tenant domain (ends with auth.com), e.g. domain.auth.com',
          seedValue: 'domain.auth.com',
          exampleValue: '<AUTH_TENANT_DOMAIN>',
        });

        configService.configFields.set('AUTH_CLIENT_ID', {
          validator: tsCodeFragment('z.string().min(1)'),
          comment:
            'Auth management client ID (https://auth.com/docs/get-started/auth-overview/create-applications/machine-to-machine-apps)',
          seedValue: 'CLIENT_ID',
          exampleValue: '<AUTH_CLIENT_ID>',
        });

        configService.configFields.set('AUTH_CLIENT_SECRET', {
          validator: tsCodeFragment('z.string().min(1)'),
          comment: 'Auth management client secret',
          seedValue: 'CLIENT_SECRET',
          exampleValue: '<AUTH_CLIENT_SECRET>',
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
            authModule: {},
            userSessionServiceImports: createAuthModuleImports(
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
      prod: extractPackageVersions(AUTH_PACKAGES, ['fastify-auth-verify']),
    }),
    fastifyAuthPlugin: createGeneratorTask({
      dependencies: {
        fastifyServerConfig: fastifyServerConfigProvider,
        configServiceImports: configServiceImportsProvider,
      },
      run({ fastifyServerConfig, configServiceImports }) {
        fastifyServerConfig.plugins.set('fastifyAuthVerify', {
          plugin: tsCodeFragment(
            'fastifyAuthVerify',
            tsImportBuilder()
              .default('fastifyAuthVerify')
              .from('fastify-auth-verify'),
          ),
          options: tsCodeFragment(
            `{
    domain: config.AUTH_DOMAIN,
    audience: config.AUTH_AUDIENCE,
  }`,
            configServiceImports.config.declaration(),
          ),
        });
      },
    }),
    loggerSetup: createGeneratorTask({
      dependencies: {
        loggerServiceConfig: loggerServiceConfigProvider,
      },
      run({ loggerServiceConfig }) {
        loggerServiceConfig.mixins.set(
          'userId',
          tsCodeFragment(
            "requestContext.get('userId')",
            tsImportBuilder()
              .named('requestContext')
              .from('@fastify/request-context'),
          ),
        );
      },
    }),
  }),
});
