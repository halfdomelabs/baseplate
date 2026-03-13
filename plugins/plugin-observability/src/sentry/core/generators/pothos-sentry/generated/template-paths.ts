import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface PothosPothosSentryPaths {
  useSentry: string;
}

const pothosPothosSentryPaths = createProviderType<PothosPothosSentryPaths>(
  'pothos-pothos-sentry-paths',
);

const pothosPothosSentryPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { pothosPothosSentryPaths: pothosPothosSentryPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        pothosPothosSentryPaths: {
          useSentry: `${srcRoot}/plugins/graphql/use-sentry.ts`,
        },
      },
    };
  },
});

export const POTHOS_POTHOS_SENTRY_PATHS = {
  provider: pothosPothosSentryPaths,
  task: pothosPothosSentryPathsTask,
};
