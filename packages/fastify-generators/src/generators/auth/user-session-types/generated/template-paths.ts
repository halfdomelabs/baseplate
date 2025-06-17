import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { appModuleProvider } from '#src/generators/core/app-module/app-module.generator.js';

export interface AuthUserSessionTypesPaths {
  userSessionTypes: string;
}

const authUserSessionTypesPaths = createProviderType<AuthUserSessionTypesPaths>(
  'auth-user-session-types-paths',
);

const authUserSessionTypesPathsTask = createGeneratorTask({
  dependencies: { appModule: appModuleProvider },
  exports: { authUserSessionTypesPaths: authUserSessionTypesPaths.export() },
  run({ appModule }) {
    const moduleRoot = appModule.getModuleFolder();

    return {
      providers: {
        authUserSessionTypesPaths: {
          userSessionTypes: `${moduleRoot}/types/user-session.types.ts`,
        },
      },
    };
  },
});

export const AUTH_USER_SESSION_TYPES_PATHS = {
  provider: authUserSessionTypesPaths,
  task: authUserSessionTypesPathsTask,
};
