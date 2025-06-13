import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { appModuleProvider } from '#src/generators/core/app-module/app-module.generator.js';

export interface AuthPlaceholderAuthServicePaths {
  userSessionService: string;
}

const authPlaceholderAuthServicePaths =
  createProviderType<AuthPlaceholderAuthServicePaths>(
    'auth-placeholder-auth-service-paths',
  );

const authPlaceholderAuthServicePathsTask = createGeneratorTask({
  dependencies: { appModule: appModuleProvider },
  exports: {
    authPlaceholderAuthServicePaths: authPlaceholderAuthServicePaths.export(),
  },
  run({ appModule }) {
    const moduleRoot = appModule.getModuleFolder();

    return {
      providers: {
        authPlaceholderAuthServicePaths: {
          userSessionService: `${moduleRoot}/services/user-session.service.ts`,
        },
      },
    };
  },
});

export const AUTH_PLACEHOLDER_AUTH_SERVICE_PATHS = {
  provider: authPlaceholderAuthServicePaths,
  task: authPlaceholderAuthServicePathsTask,
};
