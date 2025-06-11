import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { packageInfoProvider } from '#src/providers/project.js';

export interface NodeTsUtilsPaths {
  arrays: string;
  normalizeTypes: string;
  nulls: string;
  string: string;
}

const nodeTsUtilsPaths = createProviderType<NodeTsUtilsPaths>(
  'node-ts-utils-paths',
);

const nodeTsUtilsPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { nodeTsUtilsPaths: nodeTsUtilsPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        nodeTsUtilsPaths: {
          arrays: `${srcRoot}/utils/arrays.ts`,
          normalizeTypes: `${srcRoot}/utils/normalize-types.ts`,
          nulls: `${srcRoot}/utils/nulls.ts`,
          string: `${srcRoot}/utils/string.ts`,
        },
      },
    };
  },
});

export const NODE_TS_UTILS_PATHS = {
  provider: nodeTsUtilsPaths,
  task: nodeTsUtilsPathsTask,
};
