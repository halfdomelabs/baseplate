import { appModuleProvider } from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface BetterAuthBetterAuthModulePaths {
  auth: string;
  betterAuthPlugin: string;
  headersUtils: string;
  userSessionQueries: string;
  userSessionService: string;
}

const betterAuthBetterAuthModulePaths =
  createProviderType<BetterAuthBetterAuthModulePaths>(
    'better-auth-better-auth-module-paths',
  );

const betterAuthBetterAuthModulePathsTask = createGeneratorTask({
  dependencies: { appModule: appModuleProvider },
  exports: {
    betterAuthBetterAuthModulePaths: betterAuthBetterAuthModulePaths.export(),
  },
  run({ appModule }) {
    const moduleRoot = appModule.getModuleFolder();

    return {
      providers: {
        betterAuthBetterAuthModulePaths: {
          auth: `${moduleRoot}/services/auth.ts`,
          betterAuthPlugin: `${moduleRoot}/plugins/better-auth.plugin.ts`,
          headersUtils: `${moduleRoot}/utils/headers.utils.ts`,
          userSessionQueries: `${moduleRoot}/schema/user-session.queries.ts`,
          userSessionService: `${moduleRoot}/services/user-session.service.ts`,
        },
      },
    };
  },
});

export const BETTER_AUTH_BETTER_AUTH_MODULE_PATHS = {
  provider: betterAuthBetterAuthModulePaths,
  task: betterAuthBetterAuthModulePathsTask,
};
