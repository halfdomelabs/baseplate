import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface CoreErrorHandlerServicePaths {
  errorHandlerPlugin: string;
  errorLogger: string;
  httpErrors: string;
  zod: string;
}

const coreErrorHandlerServicePaths =
  createProviderType<CoreErrorHandlerServicePaths>(
    'core-error-handler-service-paths',
  );

const coreErrorHandlerServicePathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: {
    coreErrorHandlerServicePaths: coreErrorHandlerServicePaths.export(),
  },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        coreErrorHandlerServicePaths: {
          errorHandlerPlugin: `${srcRoot}/plugins/error-handler.ts`,
          errorLogger: `${srcRoot}/services/error-logger.ts`,
          httpErrors: `${srcRoot}/utils/http-errors.ts`,
          zod: `${srcRoot}/utils/zod.ts`,
        },
      },
    };
  },
});

export const CORE_ERROR_HANDLER_SERVICE_PATHS = {
  provider: coreErrorHandlerServicePaths,
  task: coreErrorHandlerServicePathsTask,
};
