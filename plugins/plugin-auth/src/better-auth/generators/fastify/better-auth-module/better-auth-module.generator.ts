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
import { z } from 'zod';

import { BETTER_AUTH_MODELS } from '#src/better-auth/constants/model-names.js';
import { BETTER_AUTH_PACKAGES } from '#src/better-auth/constants/packages.js';

import { BETTER_AUTH_BETTER_AUTH_MODULE_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({
  devWebPorts: z.array(z.number()).default([]),
  devBackendPort: z.number(),
  devWebDomainPort: z.number(),
});

export const betterAuthModuleGenerator = createGenerator({
  name: 'better-auth/better-auth-module',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ devWebPorts, devBackendPort, devWebDomainPort }) => ({
    paths: BETTER_AUTH_BETTER_AUTH_MODULE_GENERATED.paths.task,
    imports: BETTER_AUTH_BETTER_AUTH_MODULE_GENERATED.imports.task,
    renderers: BETTER_AUTH_BETTER_AUTH_MODULE_GENERATED.renderers.task,
    config: createProviderTask(configServiceProvider, (configService) => {
      const betterAuthSecret = 'dev-secret-change-me-in-production';
      configService.configFields.set('BETTER_AUTH_SECRET', {
        validator: tsCodeFragment('z.string().min(32)'),
        comment: 'Better Auth secret key for signing sessions',
        seedValue: betterAuthSecret,
        exampleValue: betterAuthSecret,
      });

      const betterAuthUrl = `http://localhost:${String(devBackendPort)}`;

      configService.configFields.set('BETTER_AUTH_URL', {
        validator: tsCodeFragment('z.url()'),
        comment: 'Better Auth base URL (backend server URL)',
        seedValue: betterAuthUrl,
        exampleValue: betterAuthUrl,
      });

      const allowedOrigins = devWebPorts
        .map((p) => `http://localhost:${String(p)}`)
        .join(',');

      configService.configFields.set('ALLOWED_ORIGINS', {
        validator: tsCodeFragment('z.string().default("")'),
        comment:
          'Comma-separated list of allowed CORS origins (e.g. https://example.com,https://app.example.com)',
        seedValue: allowedOrigins,
        exampleValue: allowedOrigins,
      });

      configService.configFields.set('AUTH_FRONTEND_URL', {
        validator: tsCodeFragment('z.url()'),
        comment:
          'Frontend URL for authentication flows including password reset and email verification (e.g., https://app.example.com)',
        exampleValue: `http://localhost:${devWebDomainPort}`,
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
        appRuntimeConfig.services.set(
          'betterAuth',
          tsCodeFragment(
            'Auth',
            tsTypeImportBuilder(['Auth']).from(paths.auth),
          ),
        );
        appRuntimeConfig.services.set(
          'userSession',
          userSessionTypesImports.UserSessionService.typeFragment(),
        );
        // Both consts are emitted from a single construction entry so
        // `userSession`'s construction (which depends on `betterAuth` being
        // built first) doesn't rely on map key ordering.
        appRuntimeConfig.construction.set('betterAuth', {
          fragment: TsCodeUtils.template`
            const betterAuth = ${TsCodeUtils.importFragment('buildAuth', paths.auth)}({ queues });
            const userSession = ${TsCodeUtils.importFragment('createBetterAuthUserSessionService', paths.userSessionService)}(betterAuth);
          `,
        });
      },
    }),
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(BETTER_AUTH_PACKAGES, ['better-auth']),
    }),
  }),
});
