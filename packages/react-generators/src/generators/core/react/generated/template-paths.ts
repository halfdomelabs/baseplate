import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface CoreReactPaths {
  indexHtml: string;
  readme: string;
  viteEnv: string;
  viteConfig: string;
  index: string;
  favicon: string;
}

const coreReactPaths = createProviderType<CoreReactPaths>('core-react-paths');

const coreReactPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { coreReactPaths: coreReactPaths.export() },
  run({ packageInfo }) {
    const packageRoot = packageInfo.getPackageRoot();
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        coreReactPaths: {
          favicon: `${packageRoot}/public/favicon.ico`,
          index: `${srcRoot}/index.tsx`,
          indexHtml: `${packageRoot}/index.html`,
          readme: `${packageRoot}/README.md`,
          viteConfig: `${packageRoot}/vite.config.ts`,
          viteEnv: `${srcRoot}/vite-env.d.ts`,
        },
      },
    };
  },
});

export const CORE_REACT_PATHS = {
  provider: coreReactPaths,
  task: coreReactPathsTask,
};
