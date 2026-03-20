import { appModuleProvider } from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface ResendCoreResendPaths {
  resendService: string;
}

const resendCoreResendPaths = createProviderType<ResendCoreResendPaths>(
  'resend-core-resend-paths',
);

const resendCoreResendPathsTask = createGeneratorTask({
  dependencies: { appModule: appModuleProvider },
  exports: { resendCoreResendPaths: resendCoreResendPaths.export() },
  run({ appModule }) {
    const moduleRoot = appModule.getModuleFolder();

    return {
      providers: {
        resendCoreResendPaths: {
          resendService: `${moduleRoot}/emails/services/resend.service.ts`,
        },
      },
    };
  },
});

export const RESEND_CORE_RESEND_PATHS = {
  provider: resendCoreResendPaths,
  task: resendCoreResendPathsTask,
};
