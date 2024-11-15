import type {
  ImportMapper,
  TypescriptCodeExpression,
} from '@halfdomelabs/core-generators';

import {
  nodeProvider,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithChildren,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { reactProvider } from '../react/index.js';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

export interface ReactLoggerProvider extends ImportMapper {
  getLoggerExpression(): TypescriptCodeExpression;
}

export const reactLoggerProvider =
  createProviderType<ReactLoggerProvider>('react-logger');

const ReactLoggerGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    node: nodeProvider,
    react: reactProvider,
    typescript: typescriptProvider,
  },
  exports: {
    reactLogger: reactLoggerProvider,
  },
  createGenerator(descriptor, { node, react, typescript }) {
    node.addPackages({
      loglevel: '1.9.1',
    });

    return {
      getProviders: () => ({
        reactLogger: {
          getLoggerExpression: () =>
            TypescriptCodeUtils.createExpression(
              'logger',
              `import { logger  } from "@/${react.getSrcFolder()}/services/logger";`,
            ),
          getImportMap: () => ({
            '%react-logger': {
              path: `@/${react.getSrcFolder()}/services/logger`,
              allowedImports: ['logger'],
            },
          }),
        },
      }),
      build: async (builder) => {
        builder.setBaseDirectory(react.getSrcFolder());
        await builder.apply(
          typescript.createCopyAction({
            source: 'logger.ts',
            destination: 'services/logger.ts',
          }),
        );
      },
    };
  },
});

export default ReactLoggerGenerator;
