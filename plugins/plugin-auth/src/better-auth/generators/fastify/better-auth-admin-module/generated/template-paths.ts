import { appModuleProvider } from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface BetterAuthBetterAuthAdminModulePaths {
  adminAuthMutations: string;
  adminAuthService: string;
}

const betterAuthBetterAuthAdminModulePaths =
  createProviderType<BetterAuthBetterAuthAdminModulePaths>(
    'better-auth-better-auth-admin-module-paths',
  );

const betterAuthBetterAuthAdminModulePathsTask = createGeneratorTask({
  dependencies: { appModule: appModuleProvider },
  exports: {
    betterAuthBetterAuthAdminModulePaths:
      betterAuthBetterAuthAdminModulePaths.export(),
  },
  run({ appModule }) {
    const moduleRoot = appModule.getModuleFolder();

    return {
      providers: {
        betterAuthBetterAuthAdminModulePaths: {
          adminAuthMutations: `${moduleRoot}/schema/admin-auth.mutations.ts`,
          adminAuthService: `${moduleRoot}/services/admin-auth.service.ts`,
        },
      },
    };
  },
});

export const BETTER_AUTH_BETTER_AUTH_ADMIN_MODULE_PATHS = {
  provider: betterAuthBetterAuthAdminModulePaths,
  task: betterAuthBetterAuthAdminModulePathsTask,
};
