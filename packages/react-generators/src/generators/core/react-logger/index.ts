import type {
  ImportMapper,
  TypescriptCodeExpression,
} from '@halfdomelabs/core-generators';

import {
  nodeProvider,
  projectScope,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import { createGenerator, createProviderType } from '@halfdomelabs/sync';
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

export const reactLoggerGenerator = createGenerator({
  name: 'core/react-logger',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks(taskBuilder) {
    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        node: nodeProvider,
        react: reactProvider,
        typescript: typescriptProvider,
      },
      exports: {
        reactLogger: reactLoggerProvider.export(projectScope),
      },
      run({ node, react, typescript }) {
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
  },
});
