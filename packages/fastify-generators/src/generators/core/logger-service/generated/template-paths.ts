import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface CoreLoggerServicePaths {
  logger: string;
}

const coreLoggerServicePaths = createProviderType<CoreLoggerServicePaths>(
  'core-logger-service-paths',
);

const coreLoggerServicePathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { coreLoggerServicePaths: coreLoggerServicePaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        coreLoggerServicePaths: { logger: `${srcRoot}/services/logger.ts` },
      },
    };
  },
});

export const CORE_LOGGER_SERVICE_PATHS = {
  provider: coreLoggerServicePaths,
  task: coreLoggerServicePathsTask,
};
