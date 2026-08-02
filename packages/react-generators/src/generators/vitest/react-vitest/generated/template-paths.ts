import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface VitestReactVitestPaths {
  setup: string;
}

const vitestReactVitestPaths = createProviderType<VitestReactVitestPaths>(
  'vitest-react-vitest-paths',
);

const vitestReactVitestPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { vitestReactVitestPaths: vitestReactVitestPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        vitestReactVitestPaths: { setup: `${srcRoot}/tests/setup.ts` },
      },
    };
  },
});

export const VITEST_REACT_VITEST_PATHS = {
  provider: vitestReactVitestPaths,
  task: vitestReactVitestPathsTask,
};
