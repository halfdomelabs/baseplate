import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface CoreReactLoggerPaths {
  logger: string;
}

const coreReactLoggerPaths = createProviderType<CoreReactLoggerPaths>(
  'core-react-logger-paths',
);

const coreReactLoggerPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { coreReactLoggerPaths: coreReactLoggerPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        coreReactLoggerPaths: { logger: `${srcRoot}/services/logger.ts` },
      },
    };
  },
});

export const CORE_REACT_LOGGER_PATHS = {
  provider: coreReactLoggerPaths,
  task: coreReactLoggerPathsTask,
};
