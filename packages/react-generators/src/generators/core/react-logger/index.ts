import {
  copyTypescriptFileAction,
  nodeProvider,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
} from '@baseplate/sync';
import * as yup from 'yup';
import { reactProvider } from '../react';

const descriptorSchema = yup.object({
  placeholder: yup.string(),
});

export interface ReactLoggerProvider {
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
  },
  exports: {
    reactLogger: reactLoggerProvider,
  },
  createGenerator(descriptor, { node, react }) {
    node.addPackages({
      loglevel: '^1.8.0',
    });

    return {
      getProviders: () => ({
        reactLogger: {
          getLoggerExpression: () =>
            TypescriptCodeUtils.createExpression(
              'logger',
              `import { logger  } from "@/${react.getSrcFolder()}/services/logger";`
            ),
        },
      }),
      build: async (builder) => {
        builder.setBaseDirectory(react.getSrcFolder());
        await builder.apply(
          copyTypescriptFileAction({
            source: 'logger.ts',
            destination: 'services/logger.ts',
          })
        );
      },
    };
  },
});

export default ReactLoggerGenerator;
