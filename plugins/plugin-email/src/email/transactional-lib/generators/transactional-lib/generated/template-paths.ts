import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface EmailTransactionalLibPaths {
  componentsButton: string;
  componentsDivider: string;
  componentsHeading: string;
  componentsIndex: string;
  componentsLayout: string;
  componentsLink: string;
  componentsSection: string;
  componentsText: string;
  constantsTheme: string;
  emailsIndex: string;
  emailsTest: string;
  servicesRenderEmail: string;
  typesEmailComponent: string;
}

const emailTransactionalLibPaths =
  createProviderType<EmailTransactionalLibPaths>(
    'email-transactional-lib-paths',
  );

const emailTransactionalLibPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { emailTransactionalLibPaths: emailTransactionalLibPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        emailTransactionalLibPaths: {
          componentsButton: `${srcRoot}/components/button.tsx`,
          componentsDivider: `${srcRoot}/components/divider.tsx`,
          componentsHeading: `${srcRoot}/components/heading.tsx`,
          componentsIndex: `${srcRoot}/components/index.ts`,
          componentsLayout: `${srcRoot}/components/layout.tsx`,
          componentsLink: `${srcRoot}/components/link.tsx`,
          componentsSection: `${srcRoot}/components/section.tsx`,
          componentsText: `${srcRoot}/components/text.tsx`,
          constantsTheme: `${srcRoot}/constants/theme.ts`,
          emailsIndex: `${srcRoot}/emails/index.ts`,
          emailsTest: `${srcRoot}/emails/test.email.tsx`,
          servicesRenderEmail: `${srcRoot}/services/render-email.service.tsx`,
          typesEmailComponent: `${srcRoot}/types/email-component.types.ts`,
        },
      },
    };
  },
});

export const EMAIL_TRANSACTIONAL_LIB_PATHS = {
  provider: emailTransactionalLibPaths,
  task: emailTransactionalLibPathsTask,
};
