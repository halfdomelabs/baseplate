import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface CoreReactSentryPaths {
  sentry: string;
}

const coreReactSentryPaths = createProviderType<CoreReactSentryPaths>(
  'core-react-sentry-paths',
);

const coreReactSentryPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { coreReactSentryPaths: coreReactSentryPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        coreReactSentryPaths: { sentry: `${srcRoot}/services/sentry.ts` },
      },
    };
  },
});

export const CORE_REACT_SENTRY_PATHS = {
  provider: coreReactSentryPaths,
  task: coreReactSentryPathsTask,
};
