import {
  createNodePackagesTask,
  extractPackageVersions,
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
  tsTypeImportBuilder,
} from '@baseplate-dev/core-generators';
import {
  appModuleProvider,
  appRuntimeConfigProvider,
  configServiceProvider,
  prismaOutputProvider,
  userSessionTypesImportsProvider,
} from '@baseplate-dev/fastify-generators';
import { transactionalLibConfigProvider } from '@baseplate-dev/plugin-email';
import {
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@baseplate-dev/sync';
import { quot } from '@baseplate-dev/utils';
import { z } from 'zod';

import { BETTER_AUTH_MODELS } from '#src/better-auth/constants/model-names.js';
import { BETTER_AUTH_PACKAGES } from '#src/better-auth/constants/packages.js';

import { BETTER_AUTH_BETTER_AUTH_MODULE_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({
  devBackendPort: z.number(),
  /** Web app the links in auth emails point at. */
  webAppName: z.string(),
});

export const betterAuthModuleGenerator = createGenerator({
  name: 'better-auth/better-auth-module',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ devBackendPort, webAppName }) => ({
    paths: BETTER_AUTH_BETTER_AUTH_MODULE_GENERATED.paths.task,
    imports: BETTER_AUTH_BETTER_AUTH_MODULE_GENERATED.imports.task,
    renderers: BETTER_AUTH_BETTER_AUTH_MODULE_GENERATED.renderers.task,
    config: createProviderTask(configServiceProvider, (configService) => {
      const betterAuthUrl = `http://localhost:${String(devBackendPort)}`;

      configService.configFields.set('BETTER_AUTH_URL', {
        validator: tsCodeFragment('z.url()'),
        comment: 'Better Auth base URL (backend server URL)',
        seedValue: betterAuthUrl,
        exampleValue: betterAuthUrl,
      });
    }),
    main: createGeneratorTask({
      dependencies: {
        prismaOutput: prismaOutputProvider,
        renderers: BETTER_AUTH_BETTER_AUTH_MODULE_GENERATED.renderers.provider,
        appModule: appModuleProvider,
        paths: BETTER_AUTH_BETTER_AUTH_MODULE_GENERATED.paths.provider,
        transactionalLibConfig: transactionalLibConfigProvider,
      },
      run({
        prismaOutput,
        renderers,
        appModule,
        paths,
        transactionalLibConfig,
      }) {
        const transactionalLibPackageName =
          transactionalLibConfig.getTransactionalLibPackageName();

        appModule.moduleFields.set(
          'plugins',
          'betterAuthPlugin',
          tsCodeFragment(
            'betterAuthPlugin',
            tsImportBuilder(['betterAuthPlugin']).from(paths.betterAuthPlugin),
          ),
        );

        appModule.moduleImports.push(paths.userSessionQueries);

        return {
          build: async (builder) => {
            await builder.apply(
              renderers.auth.render({
                variables: {
                  TPL_AUTH_WEB_APP: quot(webAppName),
                  TPL_USER_ROLE_MODEL: prismaOutput.getPrismaModelFragment(
                    BETTER_AUTH_MODELS.userRole,
                  ),
                  TPL_PASSWORD_RESET_EMAIL: TsCodeUtils.importFragment(
                    'PasswordResetEmail',
                    transactionalLibPackageName,
                  ),
                  TPL_ACCOUNT_VERIFICATION_EMAIL: TsCodeUtils.importFragment(
                    'AccountVerificationEmail',
                    transactionalLibPackageName,
                  ),
                },
              }),
            );
            await builder.apply(renderers.userSessionService.render({}));
            await builder.apply(renderers.userSessionQueries.render({}));
            await builder.apply(renderers.betterAuthPlugin.render({}));
            await builder.apply(renderers.headersUtils.render({}));
          },
        };
      },
    }),
    appRuntimeConfig: createGeneratorTask({
      dependencies: {
        appRuntimeConfig: appRuntimeConfigProvider,
        userSessionTypesImports: userSessionTypesImportsProvider,
        paths: BETTER_AUTH_BETTER_AUTH_MODULE_GENERATED.paths.provider,
      },
      run({ appRuntimeConfig, userSessionTypesImports, paths }) {
        appRuntimeConfig.services.set('betterAuth', {
          type: tsCodeFragment(
            'Auth',
            tsTypeImportBuilder(['Auth']).from(paths.auth),
          ),
        });
        appRuntimeConfig.services.set('userSession', {
          type: userSessionTypesImports.UserSessionService.typeFragment(),
        });
        appRuntimeConfig.construction.set('betterAuth', {
          dependencies: ['email'],
          fragment: TsCodeUtils.template`${TsCodeUtils.importFragment('buildAuth', paths.auth)}({ email })`,
        });
        appRuntimeConfig.construction.set('userSession', {
          dependencies: ['betterAuth'],
          fragment: TsCodeUtils.template`${TsCodeUtils.importFragment('createBetterAuthUserSessionService', paths.userSessionService)}(betterAuth)`,
        });
      },
    }),
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(BETTER_AUTH_PACKAGES, ['better-auth']),
    }),
  }),
});
