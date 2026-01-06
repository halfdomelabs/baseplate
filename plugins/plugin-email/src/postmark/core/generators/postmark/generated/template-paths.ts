import { appModuleProvider } from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface PostmarkPostmarkPaths {
  postmarkService: string;
}

const postmarkPostmarkPaths = createProviderType<PostmarkPostmarkPaths>(
  'postmark-postmark-paths',
);

const postmarkPostmarkPathsTask = createGeneratorTask({
  dependencies: { appModule: appModuleProvider },
  exports: { postmarkPostmarkPaths: postmarkPostmarkPaths.export() },
  run({ appModule }) {
    const moduleRoot = appModule.getModuleFolder();

    return {
      providers: {
        postmarkPostmarkPaths: {
          postmarkService: `${moduleRoot}/emails/services/postmark.service.ts`,
        },
      },
    };
  },
});

export const POSTMARK_POSTMARK_PATHS = {
  provider: postmarkPostmarkPaths,
  task: postmarkPostmarkPathsTask,
};
