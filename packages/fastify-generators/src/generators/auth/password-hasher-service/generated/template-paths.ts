import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { appModuleProvider } from '#src/generators/core/app-module/app-module.generator.js';

export interface AuthPasswordHasherServicePaths {
  passwordHasherService: string;
}

const authPasswordHasherServicePaths =
  createProviderType<AuthPasswordHasherServicePaths>(
    'auth-password-hasher-service-paths',
  );

const authPasswordHasherServicePathsTask = createGeneratorTask({
  dependencies: { appModule: appModuleProvider },
  exports: {
    authPasswordHasherServicePaths: authPasswordHasherServicePaths.export(),
  },
  run({ appModule }) {
    const moduleRoot = appModule.getModuleFolder();

    return {
      providers: {
        authPasswordHasherServicePaths: {
          passwordHasherService: `${moduleRoot}/services/password-hasher.service.ts`,
        },
      },
    };
  },
});

export const AUTH_PASSWORD_HASHER_SERVICE_PATHS = {
  provider: authPasswordHasherServicePaths,
  task: authPasswordHasherServicePathsTask,
};
