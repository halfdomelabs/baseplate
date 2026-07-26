import { appModuleProvider } from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface StubCoreStubPaths {
  stubAdapter: string;
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
          stubAdapter: `${moduleRoot}/services/stub.adapter.ts`,
        },
      },
    };
  },
});

export const STUB_CORE_STUB_PATHS = {
  provider: stubCoreStubPaths,
  task: stubCoreStubPathsTask,
};
