import { appModuleProvider } from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface LocalAuthCoreAuthEmailPasswordPaths {
  constantsPassword: string;
  schemaUserPasswordMutations: string;
  servicesUserPassword: string;
}

const localAuthCoreAuthEmailPasswordPaths =
  createProviderType<LocalAuthCoreAuthEmailPasswordPaths>(
    'local-auth-core-auth-email-password-paths',
  );

const localAuthCoreAuthEmailPasswordPathsTask = createGeneratorTask({
  dependencies: { appModule: appModuleProvider },
  exports: {
    localAuthCoreAuthEmailPasswordPaths:
      localAuthCoreAuthEmailPasswordPaths.export(),
  },
  run({ appModule }) {
    const moduleRoot = appModule.getModuleFolder();

    return {
      providers: {
        localAuthCoreAuthEmailPasswordPaths: {
          constantsPassword: `${moduleRoot}/constants/password.constants.ts`,
          schemaUserPasswordMutations: `${moduleRoot}/schema/user-password.mutations.ts`,
          servicesUserPassword: `${moduleRoot}/services/user-password.service.ts`,
        },
      },
    };
  },
});

export const LOCAL_AUTH_CORE_AUTH_EMAIL_PASSWORD_PATHS = {
  provider: localAuthCoreAuthEmailPasswordPaths,
  task: localAuthCoreAuthEmailPasswordPathsTask,
};
