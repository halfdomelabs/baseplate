import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface CoreFastifyScriptsPaths {
  tsconfig: string;
}

const coreFastifyScriptsPaths = createProviderType<CoreFastifyScriptsPaths>(
  'core-fastify-scripts-paths',
);

const coreFastifyScriptsPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { coreFastifyScriptsPaths: coreFastifyScriptsPaths.export() },
  run({ packageInfo }) {
    const packageRoot = packageInfo.getPackageRoot();

    return {
      providers: {
        coreFastifyScriptsPaths: {
          tsconfig: `${packageRoot}/scripts/tsconfig.json`,
        },
      },
    };
  },
});

export const CORE_FASTIFY_SCRIPTS_PATHS = {
  provider: coreFastifyScriptsPaths,
  task: coreFastifyScriptsPathsTask,
};
