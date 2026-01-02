import {
  createNodePackagesTask,
  extractPackageVersions,
  TsCodeUtils,
  tsImportBuilder,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { REACT_PACKAGES } from '#src/constants/react-packages.js';

import { reactAppConfigProvider } from '../react-app/index.js';
import { CORE_REACT_ERROR_BOUNDARY_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

export const reactErrorBoundaryGenerator = createGenerator({
  name: 'core/react-error-boundary',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(REACT_PACKAGES, ['react-error-boundary']),
    }),
    paths: CORE_REACT_ERROR_BOUNDARY_GENERATED.paths.task,
    renderers: CORE_REACT_ERROR_BOUNDARY_GENERATED.renderers.task,
    reactAppConfig: createGeneratorTask({
      dependencies: {
        reactAppConfig: reactAppConfigProvider,
        paths: CORE_REACT_ERROR_BOUNDARY_GENERATED.paths.provider,
      },
      run({ reactAppConfig, paths }) {
        reactAppConfig.errorBoundary.set(
          (contents) =>
            TsCodeUtils.templateWithImports(
              tsImportBuilder(['ErrorBoundary']).from(paths.component),
            )`<ErrorBoundary>${contents}</ErrorBoundary>`,
        );
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        renderers: CORE_REACT_ERROR_BOUNDARY_GENERATED.renderers.provider,
      },
      run({ renderers }) {
        return {
          build: async (builder) => {
            await builder.apply(renderers.component.render({}));
            await builder.apply(renderers.asyncBoundary.render({}));
          },
        };
      },
    }),
  }),
});
