import {
  createNodePackagesTask,
  extractPackageVersions,
  makeImportAndFilePath,
  projectScope,
  TsCodeUtils,
  tsImportBuilder,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { REACT_PACKAGES } from '@src/constants/react-packages.js';

import { reactAppConfigProvider } from '../react-app/react-app.generator.js';
import { reactComponentsProvider } from '../react-components/react-components.generator.js';
import { reactErrorProvider } from '../react-error/react-error.generator.js';

const descriptorSchema = z.object({});

export type ReactErrorBoundaryProvider = unknown;

export const reactErrorBoundaryProvider =
  createProviderType<ReactErrorBoundaryProvider>('react-error-boundary');

export const reactErrorBoundaryGenerator = createGenerator({
  name: 'core/react-error-boundary',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(REACT_PACKAGES, ['react-error-boundary']),
    }),
    main: createGeneratorTask({
      dependencies: {
        reactAppConfig: reactAppConfigProvider,
        reactError: reactErrorProvider,
        reactComponents: reactComponentsProvider,
        typescript: typescriptProvider,
      },
      exports: {
        reactErrorBoundary: reactErrorBoundaryProvider.export(projectScope),
      },
      run({ reactAppConfig, reactError, reactComponents, typescript }) {
        const [errorBoundaryImport, errorBoundaryPath] = makeImportAndFilePath(
          'src/components/ErrorBoundary/index.tsx',
        );

        return {
          providers: {
            reactErrorBoundary: {},
          },
          build: async (builder) => {
            const importMappers = [reactComponents, reactError];
            const errorBoundaryFile = typescript.createTemplate(
              {},
              {
                importMappers,
              },
            );

            reactAppConfig.errorBoundary.set(
              (contents) =>
                TsCodeUtils.templateWithImports(
                  tsImportBuilder(['ErrorBoundary']).from(errorBoundaryImport),
                )`<ErrorBoundary>${contents}</ErrorBoundary>`,
            );

            await builder.apply(
              errorBoundaryFile.renderToAction(
                'error-boundary.tsx',
                errorBoundaryPath,
              ),
            );
          },
        };
      },
    }),
  }),
});
