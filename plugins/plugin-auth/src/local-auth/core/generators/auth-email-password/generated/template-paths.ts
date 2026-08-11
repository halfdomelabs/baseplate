import { appModuleProvider } from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface LocalAuthCoreAuthEmailPasswordPaths {
  constantsOtp: string;
  constantsPassword: string;
  schemaEmailOtpMutations: string;
  schemaEmailVerificationMutations: string;
  schemaPasswordResetMutations: string;
  schemaUserPasswordMutations: string;
  servicesEmailOtp: string;
  servicesEmailVerification: string;
  servicesPasswordReset: string;
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
          constantsOtp: `${moduleRoot}/constants/otp.constants.ts`,
          constantsPassword: `${moduleRoot}/constants/password.constants.ts`,
          schemaEmailOtpMutations: `${moduleRoot}/schema/email-otp.mutations.ts`,
          schemaEmailVerificationMutations: `${moduleRoot}/schema/email-verification.mutations.ts`,
          schemaPasswordResetMutations: `${moduleRoot}/schema/password-reset.mutations.ts`,
          schemaUserPasswordMutations: `${moduleRoot}/schema/user-password.mutations.ts`,
          servicesEmailOtp: `${moduleRoot}/services/email-otp.service.ts`,
          servicesEmailVerification: `${moduleRoot}/services/email-verification.service.ts`,
          servicesPasswordReset: `${moduleRoot}/services/password-reset.service.ts`,
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
