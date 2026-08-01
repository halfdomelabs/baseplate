import {
  DEFAULT_TYPESCRIPT_COMPILER_OPTIONS,
  eslintConfigProvider,
  nodeProvider,
  typescriptSetupProvider,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { REACT_PACKAGES } from '#src/constants/react-packages.js';

const descriptorSchema = z.object({});

/**
 * Generator for configuring a react-library package with JSX support.
 *
 * This generator layers JSX compilation and React dependencies on top of
 * a node-library package, so it can be composed alongside `nodeLibraryGenerator`.
 * Tailwind support is composed separately by the compiler via `reactTailwindGenerator`
 * (with `includeViteIntegration: false`, since a library has no Vite build).
 */
export const reactLibraryGenerator = createGenerator({
  name: 'core/react-library',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    eslint: createProviderTask(eslintConfigProvider, (eslintConfig) => {
      eslintConfig.react.set(true);
    }),
    configureTypescript: createGeneratorTask({
      dependencies: {
        typescriptSetup: typescriptSetupProvider,
      },
      run({ typescriptSetup }) {
        typescriptSetup.compilerOptions.set({
          ...DEFAULT_TYPESCRIPT_COMPILER_OPTIONS,
          jsx: 'react-jsx',
          lib: [
            ...(DEFAULT_TYPESCRIPT_COMPILER_OPTIONS.lib ?? []),
            'dom',
            'dom.iterable',
          ],
          types: ['node'],
        });
      },
    }),
    nodePackages: createGeneratorTask({
      dependencies: {
        node: nodeProvider,
      },
      run({ node }) {
        node.packages.addPackages({
          peer: {
            react: REACT_PACKAGES.react,
            'react-dom': REACT_PACKAGES['react-dom'],
          },
          dev: {
            react: REACT_PACKAGES.react,
            'react-dom': REACT_PACKAGES['react-dom'],
            '@types/react': REACT_PACKAGES['@types/react'],
            '@types/react-dom': REACT_PACKAGES['@types/react-dom'],
            '@types/node': REACT_PACKAGES['@types/node'],
          },
        });
      },
    }),
  }),
});
