import { appModuleProvider } from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface PlaceholderAuthCoreAuthModulePaths {
  userSessionService: string;
}

const placeholderAuthCoreAuthModulePaths =
  createProviderType<PlaceholderAuthCoreAuthModulePaths>(
    'placeholder-auth-core-auth-module-paths',
  );

const placeholderAuthCoreAuthModulePathsTask = createGeneratorTask({
  dependencies: { appModule: appModuleProvider },
  exports: {
    placeholderAuthCoreAuthModulePaths:
      placeholderAuthCoreAuthModulePaths.export(),
  },
  run({ appModule }) {
    const moduleRoot = appModule.getModuleFolder();

    return {
      providers: {
        placeholderAuthCoreAuthModulePaths: {
          userSessionService: `${moduleRoot}/services/user-session.service.ts`,
        },
      },
    };
  },
});

export const PLACEHOLDER_AUTH_CORE_AUTH_MODULE_PATHS = {
  provider: placeholderAuthCoreAuthModulePaths,
  task: placeholderAuthCoreAuthModulePathsTask,
};
