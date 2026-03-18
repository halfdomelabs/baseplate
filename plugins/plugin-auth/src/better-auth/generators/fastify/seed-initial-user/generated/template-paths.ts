import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface BetterAuthSeedInitialUserPaths {
  seedInitialUser: string;
}

const betterAuthSeedInitialUserPaths =
  createProviderType<BetterAuthSeedInitialUserPaths>(
    'better-auth-seed-initial-user-paths',
  );

const betterAuthSeedInitialUserPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: {
    betterAuthSeedInitialUserPaths: betterAuthSeedInitialUserPaths.export(),
  },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        betterAuthSeedInitialUserPaths: {
          seedInitialUser: `${srcRoot}/prisma/seed-initial-user.ts`,
        },
      },
    };
  },
});

export const BETTER_AUTH_SEED_INITIAL_USER_PATHS = {
  provider: betterAuthSeedInitialUserPaths,
  task: betterAuthSeedInitialUserPathsTask,
};
