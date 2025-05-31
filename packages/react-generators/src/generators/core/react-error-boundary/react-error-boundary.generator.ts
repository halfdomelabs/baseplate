import {
  createNodePackagesTask,
  extractPackageVersions,
  TsCodeUtils,
  tsImportBuilder,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { REACT_PACKAGES } from '#src/constants/react-packages.js';

import { reactAppConfigProvider } from '../react-app/react-app.generator.js';
import { reactComponentsImportsProvider } from '../react-components/react-components.generator.js';
import { reactErrorImportsProvider } from '../react-error/react-error.generator.js';
import { CORE_REACT_ERROR_BOUNDARY_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({});

const errorBoundaryPath = '@/src/components/ErrorBoundary/index.tsx';

export const reactErrorBoundaryGenerator = createGenerator({
  name: 'core/react-error-boundary',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(REACT_PACKAGES, ['react-error-boundary']),
    }),
    reactAppConfig: createProviderTask(
      reactAppConfigProvider,
      (reactAppConfig) => {
        reactAppConfig.errorBoundary.set(
          (contents) =>
            TsCodeUtils.templateWithImports(
              tsImportBuilder(['ErrorBoundary']).from(errorBoundaryPath),
            )`<ErrorBoundary>${contents}</ErrorBoundary>`,
        );
      },
    ),
    main: createGeneratorTask({
      dependencies: {
        reactErrorImports: reactErrorImportsProvider,
        reactComponentsImports: reactComponentsImportsProvider,
        typescriptFile: typescriptFileProvider,
      },
      run({ reactErrorImports, reactComponentsImports, typescriptFile }) {
        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: CORE_REACT_ERROR_BOUNDARY_TS_TEMPLATES.component,
                destination: errorBoundaryPath,
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
