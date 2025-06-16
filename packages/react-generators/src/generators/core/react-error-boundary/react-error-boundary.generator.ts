import {
  createNodePackagesTask,
  extractPackageVersions,
  TsCodeUtils,
  tsImportBuilder,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { REACT_PACKAGES } from '#src/constants/react-packages.js';

import { reactAppConfigProvider } from '../react-app/index.js';
import { reactComponentsImportsProvider } from '../react-components/index.js';
import { reactErrorImportsProvider } from '../react-error/index.js';
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
        reactErrorImports: reactErrorImportsProvider,
        reactComponentsImports: reactComponentsImportsProvider,
        typescriptFile: typescriptFileProvider,
        paths: CORE_REACT_ERROR_BOUNDARY_GENERATED.paths.provider,
      },
      run({
        reactErrorImports,
        reactComponentsImports,
        typescriptFile,
        paths,
      }) {
        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template:
                  CORE_REACT_ERROR_BOUNDARY_GENERATED.templates.component,
                destination: paths.component,
                importMapProviders: {
                  reactComponentsImports,
                  reactErrorImports,
                },
                variables: {},
              }),
            );
          },
        };
      },
    }),
  }),
});
