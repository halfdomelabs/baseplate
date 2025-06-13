import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface EmailFastifyPostmarkPaths {
  postmark: string;
}

const emailFastifyPostmarkPaths = createProviderType<EmailFastifyPostmarkPaths>(
  'email-fastify-postmark-paths',
);

const emailFastifyPostmarkPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { emailFastifyPostmarkPaths: emailFastifyPostmarkPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        emailFastifyPostmarkPaths: {
          postmark: `${srcRoot}/services/postmark.ts`,
        },
      },
    };
  },
});

export const EMAIL_FASTIFY_POSTMARK_PATHS = {
  provider: emailFastifyPostmarkPaths,
  task: emailFastifyPostmarkPathsTask,
};
