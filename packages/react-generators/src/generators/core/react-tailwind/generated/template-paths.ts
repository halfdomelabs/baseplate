import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface CoreReactTailwindPaths {
  postcssConfig: string;
  tailwindConfig: string;
  indexCss: string;
}

const coreReactTailwindPaths = createProviderType<CoreReactTailwindPaths>(
  'core-react-tailwind-paths',
);

const coreReactTailwindPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { coreReactTailwindPaths: coreReactTailwindPaths.export() },
  run({ packageInfo }) {
    const packageRoot = packageInfo.getPackageRoot();
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        coreReactTailwindPaths: {
          indexCss: `${srcRoot}/index.css`,
          postcssConfig: `${packageRoot}/postcss.config.js`,
          tailwindConfig: `${packageRoot}/tailwind.config.js`,
        },
      },
    };
  },
});

export const CORE_REACT_TAILWIND_PATHS = {
  provider: coreReactTailwindPaths,
  task: coreReactTailwindPathsTask,
};
