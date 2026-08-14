import { reactRoutesProvider } from '@baseplate-dev/react-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface AuthCoreAuthRoutesPaths {
  acceptInvite: string;
  constants: string;
  forgotPassword: string;
  login: string;
  loginOtp: string;
  otpConstants: string;
  register: string;
  resetPassword: string;
  route: string;
  verifyEmail: string;
}

const authCoreAuthRoutesPaths = createProviderType<AuthCoreAuthRoutesPaths>(
  'auth-core-auth-routes-paths',
);

const authCoreAuthRoutesPathsTask = createGeneratorTask({
  dependencies: { reactRoutes: reactRoutesProvider },
  exports: { authCoreAuthRoutesPaths: authCoreAuthRoutesPaths.export() },
  run({ reactRoutes }) {
    const routesRoot = reactRoutes.getOutputRelativePath();

    return {
      providers: {
        authCoreAuthRoutesPaths: {
          acceptInvite: `${routesRoot}/auth_/accept-invite.tsx`,
          constants: `${routesRoot}/auth_/-constants.ts`,
          forgotPassword: `${routesRoot}/auth_/forgot-password.tsx`,
          login: `${routesRoot}/auth_/login.tsx`,
          loginOtp: `${routesRoot}/auth_/login-otp.tsx`,
          otpConstants: `${routesRoot}/auth_/-otp-constants.ts`,
          register: `${routesRoot}/auth_/register.tsx`,
          resetPassword: `${routesRoot}/auth_/reset-password.tsx`,
          route: `${routesRoot}/auth_/route.tsx`,
          verifyEmail: `${routesRoot}/auth_/verify-email.tsx`,
        },
      },
    };
  },
});

export const AUTH_CORE_AUTH_ROUTES_PATHS = {
  provider: authCoreAuthRoutesPaths,
  task: authCoreAuthRoutesPathsTask,
};
