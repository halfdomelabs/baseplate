import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface CoreReactTailwindPaths {
  stylesCss: string;
}

const coreReactTailwindPaths = createProviderType<CoreReactTailwindPaths>(
  'core-react-tailwind-paths',
);

const coreReactTailwindPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { coreReactTailwindPaths: coreReactTailwindPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        coreReactTailwindPaths: { stylesCss: `${srcRoot}/styles.css` },
      },
    };
  },
});

export const CORE_REACT_TAILWIND_PATHS = {
  provider: coreReactTailwindPaths,
  task: coreReactTailwindPathsTask,
};
