import { appModuleProvider } from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface PlaceholderAuthCorePlaceholderAuthModulePaths {
  userSessionService: string;
}

const placeholderAuthCorePlaceholderAuthModulePaths =
  createProviderType<PlaceholderAuthCorePlaceholderAuthModulePaths>(
    'placeholder-auth-core-placeholder-auth-module-paths',
  );

const placeholderAuthCorePlaceholderAuthModulePathsTask = createGeneratorTask({
  dependencies: { appModule: appModuleProvider },
  exports: {
    placeholderAuthCorePlaceholderAuthModulePaths:
      placeholderAuthCorePlaceholderAuthModulePaths.export(),
  },
  run({ appModule }) {
    const moduleRoot = appModule.getModuleFolder();

    return {
      providers: {
        placeholderAuthCorePlaceholderAuthModulePaths: {
          userSessionService: `${moduleRoot}/services/user-session.service.ts`,
        },
      },
    };
  },
});

export const PLACEHOLDER_AUTH_CORE_PLACEHOLDER_AUTH_MODULE_PATHS = {
  provider: placeholderAuthCorePlaceholderAuthModulePaths,
  task: placeholderAuthCorePlaceholderAuthModulePathsTask,
};
