import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface LocalAuthCoreSeedInitialUserPaths {
  seedInitialUser: string;
}

const localAuthCoreSeedInitialUserPaths =
  createProviderType<LocalAuthCoreSeedInitialUserPaths>(
    'local-auth-core-seed-initial-user-paths',
  );

const localAuthCoreSeedInitialUserPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: {
    localAuthCoreSeedInitialUserPaths:
      localAuthCoreSeedInitialUserPaths.export(),
  },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        localAuthCoreSeedInitialUserPaths: {
          seedInitialUser: `${srcRoot}/prisma/seed-initial-user.ts`,
        },
      },
    };
  },
});

export const LOCAL_AUTH_CORE_SEED_INITIAL_USER_PATHS = {
  provider: localAuthCoreSeedInitialUserPaths,
  task: localAuthCoreSeedInitialUserPathsTask,
};
