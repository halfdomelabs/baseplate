import { appModuleProvider } from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface AuthCoreAuthModulePaths {
  userSessionConstants: string;
  userSessionService: string;
  cookieSigner: string;
  sessionCookie: string;
  verifyRequestOrigin: string;
}

const authCoreAuthModulePaths = createProviderType<AuthCoreAuthModulePaths>(
  'auth-core-auth-module-paths',
);

const authCoreAuthModulePathsTask = createGeneratorTask({
  dependencies: { appModule: appModuleProvider },
  exports: { authCoreAuthModulePaths: authCoreAuthModulePaths.export() },
  run({ appModule }) {
    const moduleRoot = appModule.getModuleFolder();

    return {
      providers: {
        authCoreAuthModulePaths: {
          cookieSigner: `${moduleRoot}/utils/cookie-signer.ts`,
          sessionCookie: `${moduleRoot}/utils/session-cookie.ts`,
          userSessionConstants: `${moduleRoot}/constants/user-session.constants.ts`,
          userSessionService: `${moduleRoot}/services/user-session.service.ts`,
          verifyRequestOrigin: `${moduleRoot}/utils/verify-request-origin.ts`,
        },
      },
    };
  },
});

export const AUTH_CORE_AUTH_MODULE_PATHS = {
  provider: authCoreAuthModulePaths,
  task: authCoreAuthModulePathsTask,
};
