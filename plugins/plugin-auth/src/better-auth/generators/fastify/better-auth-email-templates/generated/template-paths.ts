import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface BetterAuthBetterAuthEmailTemplatesPaths {
  accountVerificationEmail: string;
  passwordChangedEmail: string;
  passwordResetEmail: string;
}

const betterAuthBetterAuthEmailTemplatesPaths =
  createProviderType<BetterAuthBetterAuthEmailTemplatesPaths>(
    'better-auth-better-auth-email-templates-paths',
  );

const betterAuthBetterAuthEmailTemplatesPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: {
    betterAuthBetterAuthEmailTemplatesPaths:
      betterAuthBetterAuthEmailTemplatesPaths.export(),
  },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        betterAuthBetterAuthEmailTemplatesPaths: {
          accountVerificationEmail: `${srcRoot}/emails/auth/account-verification.email.tsx`,
          passwordChangedEmail: `${srcRoot}/emails/auth/password-changed.email.tsx`,
          passwordResetEmail: `${srcRoot}/emails/auth/password-reset.email.tsx`,
        },
      },
    };
  },
});

export const BETTER_AUTH_BETTER_AUTH_EMAIL_TEMPLATES_PATHS = {
  provider: betterAuthBetterAuthEmailTemplatesPaths,
  task: betterAuthBetterAuthEmailTemplatesPathsTask,
};
