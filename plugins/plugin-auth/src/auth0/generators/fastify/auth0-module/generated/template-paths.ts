import { appModuleProvider } from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface Auth0Auth0ModulePaths {
  management: string;
  userSessionService: string;
}

const auth0Auth0ModulePaths = createProviderType<Auth0Auth0ModulePaths>(
  'auth0-auth0-module-paths',
);

const auth0Auth0ModulePathsTask = createGeneratorTask({
  dependencies: { appModule: appModuleProvider },
  exports: { auth0Auth0ModulePaths: auth0Auth0ModulePaths.export() },
  run({ appModule }) {
    const moduleRoot = appModule.getModuleFolder();

    return {
      providers: {
        auth0Auth0ModulePaths: {
          management: `${moduleRoot}/services/management.ts`,
          userSessionService: `${moduleRoot}/services/user-session.service.ts`,
        },
      },
    };
  },
});

export const AUTH0_AUTH0_MODULE_PATHS = {
  provider: auth0Auth0ModulePaths,
  task: auth0Auth0ModulePathsTask,
};
