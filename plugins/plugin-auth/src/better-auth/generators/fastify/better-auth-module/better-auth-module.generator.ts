import {
  createNodePackagesTask,
  extractPackageVersions,
  tsCodeFragment,
  tsImportBuilder,
} from '@baseplate-dev/core-generators';
import {
  appModuleProvider,
  configServiceProvider,
  prismaOutputProvider,
} from '@baseplate-dev/fastify-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { BETTER_AUTH_MODELS } from '#src/better-auth/constants/model-names.js';
import { BETTER_AUTH_PACKAGES } from '#src/better-auth/constants/packages.js';

import { BETTER_AUTH_BETTER_AUTH_MODULE_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

export const betterAuthModuleGenerator = createGenerator({
  name: 'better-auth/better-auth-module',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: BETTER_AUTH_BETTER_AUTH_MODULE_GENERATED.paths.task,
    imports: BETTER_AUTH_BETTER_AUTH_MODULE_GENERATED.imports.task,
    renderers: BETTER_AUTH_BETTER_AUTH_MODULE_GENERATED.renderers.task,
    config: createProviderTask(configServiceProvider, (configService) => {
      configService.configFields.set('BETTER_AUTH_SECRET', {
        validator: tsCodeFragment('z.string().min(32)'),
        comment: 'Better Auth secret key for signing sessions',
        seedValue: 'dev-secret-change-me-in-production',
        exampleValue: '<BETTER_AUTH_SECRET>',
      });

      configService.configFields.set('BETTER_AUTH_URL', {
        validator: tsCodeFragment('z.url()'),
        comment: 'Better Auth base URL (backend server URL)',
        seedValue: 'http://localhost:4000',
        exampleValue: '<BETTER_AUTH_URL>',
      });

      configService.configFields.set('ALLOWED_ORIGINS', {
        validator: tsCodeFragment('z.string().default("")'),
        comment:
          'Comma-separated list of allowed CORS origins (e.g. https://example.com,https://app.example.com)',
        seedValue: 'http://localhost:5173,http://localhost:5174', // TODO: Fix default value
        exampleValue: '<ALLOWED_ORIGINS>',
      });
    }),
    main: createGeneratorTask({
      dependencies: {
        prismaOutput: prismaOutputProvider,
        renderers: BETTER_AUTH_BETTER_AUTH_MODULE_GENERATED.renderers.provider,
        appModule: appModuleProvider,
        paths: BETTER_AUTH_BETTER_AUTH_MODULE_GENERATED.paths.provider,
      },
      run({ prismaOutput, renderers, appModule, paths }) {
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
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(BETTER_AUTH_PACKAGES, ['better-auth']),
    }),
  }),
});
