import { appModuleProvider } from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface AuthCoreAuthEmailPasswordPaths {
  constantsPassword: string;
  schemaUserPasswordMutations: string;
  servicesUserPassword: string;
}

const authCoreAuthEmailPasswordPaths =
  createProviderType<AuthCoreAuthEmailPasswordPaths>(
    'auth-core-auth-email-password-paths',
  );

const authCoreAuthEmailPasswordPathsTask = createGeneratorTask({
  dependencies: { appModule: appModuleProvider },
  exports: {
    authCoreAuthEmailPasswordPaths: authCoreAuthEmailPasswordPaths.export(),
  },
  run({ appModule }) {
    const moduleRoot = appModule.getModuleFolder();

    return {
      providers: {
        authCoreAuthEmailPasswordPaths: {
          constantsPassword: `${moduleRoot}/constants/password.constants.ts`,
          schemaUserPasswordMutations: `${moduleRoot}/schema/user-password.mutations.ts`,
          servicesUserPassword: `${moduleRoot}/services/user-password.service.ts`,
        },
      },
    };
  },
});

export const AUTH_CORE_AUTH_EMAIL_PASSWORD_PATHS = {
  provider: authCoreAuthEmailPasswordPaths,
  task: authCoreAuthEmailPasswordPathsTask,
};
