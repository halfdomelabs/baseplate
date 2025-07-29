import { appModuleProvider } from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface AuthCoreAuthModulePaths {
  cookieSigner: string;
  schemaUserSessionMutations: string;
  schemaUserSessionPayloadObjectType: string;
  schemaUserSessionQueries: string;
  sessionCookie: string;
  userSessionConstants: string;
  userSessionService: string;
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
          schemaUserSessionMutations: `${moduleRoot}/schema/user-session.mutations.ts`,
          schemaUserSessionPayloadObjectType: `${moduleRoot}/schema/user-session-payload.object-type.ts`,
          schemaUserSessionQueries: `${moduleRoot}/schema/user-session.queries.ts`,
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
