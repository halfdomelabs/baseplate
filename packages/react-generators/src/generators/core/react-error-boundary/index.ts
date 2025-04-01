import {
  makeImportAndFilePath,
  nodeProvider,
  projectScope,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { REACT_PACKAGES } from '@src/constants/react-packages.js';

import { reactAppProvider } from '../react-app/index.js';
import { reactComponentsProvider } from '../react-components/index.js';
import { reactErrorProvider } from '../react-error/index.js';

const descriptorSchema = z.object({});

export type ReactErrorBoundaryProvider = unknown;

export const reactErrorBoundaryProvider =
  createProviderType<ReactErrorBoundaryProvider>('react-error-boundary');

export const reactErrorBoundaryGenerator = createGenerator({
  name: 'core/react-error-boundary',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => [
    createGeneratorTask({
      name: 'main',
      dependencies: {
        node: nodeProvider,
        reactApp: reactAppProvider,
        reactError: reactErrorProvider,
        reactComponents: reactComponentsProvider,
        typescript: typescriptProvider,
      },
      exports: {
        reactErrorBoundary: reactErrorBoundaryProvider.export(projectScope),
      },
      run({ reactApp, reactError, reactComponents, typescript, node }) {
        node.addPackages({
          'react-error-boundary': REACT_PACKAGES['react-error-boundary'],
        });
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

            reactApp.setErrorBoundary(
              TypescriptCodeUtils.createWrapper(
                (contents) => `<ErrorBoundary>${contents}</ErrorBoundary>`,
                `import {ErrorBoundary} from '${errorBoundaryImport}';`,
              ),
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
  ],
});
