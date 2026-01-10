import { appModuleProvider } from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface PostmarkCorePostmarkPaths {
  postmarkService: string;
}

const postmarkCorePostmarkPaths = createProviderType<PostmarkCorePostmarkPaths>(
  'postmark-core-postmark-paths',
);

const postmarkCorePostmarkPathsTask = createGeneratorTask({
  dependencies: { appModule: appModuleProvider },
  exports: { postmarkCorePostmarkPaths: postmarkCorePostmarkPaths.export() },
  run({ appModule }) {
    const moduleRoot = appModule.getModuleFolder();

    return {
      providers: {
        postmarkCorePostmarkPaths: {
          postmarkService: `${moduleRoot}/emails/services/postmark.service.ts`,
        },
      },
    };
  },
});

export const POSTMARK_CORE_POSTMARK_PATHS = {
  provider: postmarkCorePostmarkPaths,
  task: postmarkCorePostmarkPathsTask,
};
