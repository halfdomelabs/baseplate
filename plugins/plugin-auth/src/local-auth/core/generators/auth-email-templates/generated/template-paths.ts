import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface LocalAuthAuthEmailTemplatesPaths {
  accountVerificationEmail: string;
  passwordChangedEmail: string;
  passwordResetEmail: string;
}

const localAuthAuthEmailTemplatesPaths =
  createProviderType<LocalAuthAuthEmailTemplatesPaths>(
    'local-auth-auth-email-templates-paths',
  );

const localAuthAuthEmailTemplatesPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: {
    localAuthAuthEmailTemplatesPaths: localAuthAuthEmailTemplatesPaths.export(),
  },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        localAuthAuthEmailTemplatesPaths: {
          accountVerificationEmail: `${srcRoot}/emails/auth/account-verification.email.tsx`,
          passwordChangedEmail: `${srcRoot}/emails/auth/password-changed.email.tsx`,
          passwordResetEmail: `${srcRoot}/emails/auth/password-reset.email.tsx`,
        },
      },
    };
  },
});

export const LOCAL_AUTH_AUTH_EMAIL_TEMPLATES_PATHS = {
  provider: localAuthAuthEmailTemplatesPaths,
  task: localAuthAuthEmailTemplatesPathsTask,
};
