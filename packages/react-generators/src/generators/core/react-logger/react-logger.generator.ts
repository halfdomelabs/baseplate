import {
  createNodePackagesTask,
  extractPackageVersions,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { REACT_PACKAGES } from '#src/constants/react-packages.js';

import { CORE_REACT_LOGGER_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

export const reactLoggerGenerator = createGenerator({
  name: 'core/react-logger',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(REACT_PACKAGES, ['loglevel']),
    }),
    paths: CORE_REACT_LOGGER_GENERATED.paths.task,
    imports: CORE_REACT_LOGGER_GENERATED.imports.task,
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        paths: CORE_REACT_LOGGER_GENERATED.paths.provider,
      },
      run({ typescriptFile, paths }) {
        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: CORE_REACT_LOGGER_GENERATED.templates.logger,
                destination: paths.logger,
              }),
            );
          },
        };
      },
    }),
  }),
});
