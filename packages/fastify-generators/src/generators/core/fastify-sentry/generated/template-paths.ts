import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface CoreFastifySentryPaths {
  instrument: string;
  sentry: string;
}

const coreFastifySentryPaths = createProviderType<CoreFastifySentryPaths>(
  'core-fastify-sentry-paths',
);

const coreFastifySentryPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { coreFastifySentryPaths: coreFastifySentryPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        coreFastifySentryPaths: {
          instrument: `${srcRoot}/instrument.ts`,
          sentry: `${srcRoot}/services/sentry.ts`,
        },
      },
    };
  },
});

export const CORE_FASTIFY_SENTRY_PATHS = {
  provider: coreFastifySentryPaths,
  task: coreFastifySentryPathsTask,
};
