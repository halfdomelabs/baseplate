import { appModuleProvider } from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface LocalAuthCoreAuthModulePaths {
  cookieSigner: string;
  schemaUserSessionMutations: string;
  schemaUserSessionPayloadObjectType: string;
  schemaUserSessionQueries: string;
  sessionCookie: string;
  userSessionConstants: string;
  userSessionService: string;
  verifyRequestOrigin: string;
}

const localAuthCoreAuthModulePaths =
  createProviderType<LocalAuthCoreAuthModulePaths>(
    'local-auth-core-auth-module-paths',
  );

const localAuthCoreAuthModulePathsTask = createGeneratorTask({
  dependencies: { appModule: appModuleProvider },
  exports: {
    localAuthCoreAuthModulePaths: localAuthCoreAuthModulePaths.export(),
  },
  run({ appModule }) {
    const moduleRoot = appModule.getModuleFolder();

    return {
      providers: {
        localAuthCoreAuthModulePaths: {
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

export const LOCAL_AUTH_CORE_AUTH_MODULE_PATHS = {
  provider: localAuthCoreAuthModulePaths,
  task: localAuthCoreAuthModulePathsTask,
};
