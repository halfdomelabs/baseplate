import {
  nodeProvider,
  typescriptSetupProvider,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { EMAIL_TRANSACTIONAL_LIB_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

/**
 * Package versions for the transactional email library
 */
const TRANSACTIONAL_LIB_PACKAGES = {
  prod: {
    '@react-email/components': '1.0.3',
    entities: '7.0.0',
    react: '19.1.0',
    'react-dom': '19.1.0',
  },
  dev: {
    '@types/react': '19.1.3',
  },
} as const;

/**
 * Generator for email/transactional-lib
 *
 * This generator sets up a transactional email library using React Email components.
 * It configures TypeScript for JSX and adds the necessary dependencies.
 */
export const transactionalLibGenerator = createGenerator({
  name: 'email/transactional-lib',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: EMAIL_TRANSACTIONAL_LIB_GENERATED.paths.task,
    renderers: EMAIL_TRANSACTIONAL_LIB_GENERATED.renderers.task,

    // Configure TypeScript for JSX support
    configureTypescript: createGeneratorTask({
      dependencies: {
        typescriptSetup: typescriptSetupProvider,
      },
      run({ typescriptSetup }) {
        // Add JSX support for React Email components
        typescriptSetup.compilerOptions.set({
          jsx: 'react-jsx',
        });
      },
    }),

    // Add react-email dependencies
    nodePackages: createGeneratorTask({
      dependencies: {
        node: nodeProvider,
      },
      run({ node }) {
        node.packages.addPackages({
          prod: TRANSACTIONAL_LIB_PACKAGES.prod,
          dev: TRANSACTIONAL_LIB_PACKAGES.dev,
        });
      },
    }),

    // Render templates
    main: createGeneratorTask({
      dependencies: {
        renderers: EMAIL_TRANSACTIONAL_LIB_GENERATED.renderers.provider,
      },
      run({ renderers }) {
        return {
          build: async (builder) => {
            await builder.apply(renderers.mainGroup.render({}));
          },
        };
      },
    }),
  }),
});
