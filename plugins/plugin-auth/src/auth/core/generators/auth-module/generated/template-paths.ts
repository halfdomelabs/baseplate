import { appModuleProvider } from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface FastifyAuthModulePaths {
  userSessionConstants: string;
  userSessionService: string;
  cookieSigner: string;
  sessionCookie: string;
  verifyRequestOrigin: string;
}

const fastifyAuthModulePaths = createProviderType<FastifyAuthModulePaths>(
  'fastify-auth-module-paths',
);

const fastifyAuthModulePathsTask = createGeneratorTask({
  dependencies: { appModule: appModuleProvider },
  exports: { fastifyAuthModulePaths: fastifyAuthModulePaths.export() },
  run({ appModule }) {
    const moduleRoot = appModule.getModuleFolder();

    return {
      providers: {
        fastifyAuthModulePaths: {
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

export const FASTIFY_AUTH_MODULE_PATHS = {
  provider: fastifyAuthModulePaths,
  task: fastifyAuthModulePathsTask,
};
