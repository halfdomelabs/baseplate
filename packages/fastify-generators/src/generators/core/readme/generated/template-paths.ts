import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface CoreReadmePaths {
  readme: string;
}

const coreReadmePaths =
  createProviderType<CoreReadmePaths>('core-readme-paths');

const coreReadmePathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { coreReadmePaths: coreReadmePaths.export() },
  run({ packageInfo }) {
    const packageRoot = packageInfo.getPackageRoot();

    return {
      providers: {
        coreReadmePaths: { readme: `${packageRoot}/README.md` },
      },
    };
  },
});

export const CORE_README_PATHS = {
  provider: coreReadmePaths,
  task: coreReadmePathsTask,
};
