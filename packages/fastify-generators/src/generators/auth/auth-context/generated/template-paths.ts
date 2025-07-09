import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { appModuleProvider } from '#src/generators/core/app-module/app-module.generator.js';

export interface AuthAuthContextPaths {
  authContextTypes: string;
  authContextUtils: string;
  authSessionTypes: string;
}

const authAuthContextPaths = createProviderType<AuthAuthContextPaths>(
  'auth-auth-context-paths',
);

const authAuthContextPathsTask = createGeneratorTask({
  dependencies: { appModule: appModuleProvider },
  exports: { authAuthContextPaths: authAuthContextPaths.export() },
  run({ appModule }) {
    const moduleRoot = appModule.getModuleFolder();

    return {
      providers: {
        authAuthContextPaths: {
          authContextTypes: `${moduleRoot}/types/auth-context.types.ts`,
          authContextUtils: `${moduleRoot}/utils/auth-context.utils.ts`,
          authSessionTypes: `${moduleRoot}/types/auth-session.types.ts`,
        },
      },
    };
  },
});

export const AUTH_AUTH_CONTEXT_PATHS = {
  provider: authAuthContextPaths,
  task: authAuthContextPathsTask,
};
