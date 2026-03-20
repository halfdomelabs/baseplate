import { appModuleProvider } from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface StubCoreStubPaths {
  stubService: string;
}

const stubCoreStubPaths = createProviderType<StubCoreStubPaths>(
  'stub-core-stub-paths',
);

const stubCoreStubPathsTask = createGeneratorTask({
  dependencies: { appModule: appModuleProvider },
  exports: { stubCoreStubPaths: stubCoreStubPaths.export() },
  run({ appModule }) {
    const moduleRoot = appModule.getModuleFolder();

    return {
      providers: {
        stubCoreStubPaths: {
          stubService: `${moduleRoot}/emails/services/stub.service.ts`,
        },
      },
    };
  },
});

export const STUB_CORE_STUB_PATHS = {
  provider: stubCoreStubPaths,
  task: stubCoreStubPathsTask,
};
