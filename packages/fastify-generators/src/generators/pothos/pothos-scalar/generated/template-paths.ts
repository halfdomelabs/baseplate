import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { appModuleProvider } from '#src/generators/core/app-module/app-module.generator.js';

export interface PothosPothosScalarPaths {
  date: string;
  dateTime: string;
  json: string;
  jsonObject: string;
  uuid: string;
}

const pothosPothosScalarPaths = createProviderType<PothosPothosScalarPaths>(
  'pothos-pothos-scalar-paths',
);

const pothosPothosScalarPathsTask = createGeneratorTask({
  dependencies: { appModule: appModuleProvider },
  exports: { pothosPothosScalarPaths: pothosPothosScalarPaths.export() },
  run({ appModule }) {
    const moduleRoot = appModule.getModuleFolder();

    return {
      providers: {
        pothosPothosScalarPaths: {
          date: `${moduleRoot}/scalars/date.ts`,
          dateTime: `${moduleRoot}/scalars/date-time.ts`,
          json: `${moduleRoot}/scalars/json.ts`,
          jsonObject: `${moduleRoot}/scalars/json-object.ts`,
          uuid: `${moduleRoot}/scalars/uuid.ts`,
        },
      },
    };
  },
});

export const POTHOS_POTHOS_SCALAR_PATHS = {
  provider: pothosPothosScalarPaths,
  task: pothosPothosScalarPathsTask,
};
