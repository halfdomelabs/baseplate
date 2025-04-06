import type {
  ImportMapper,
  TypescriptCodeExpression,
} from '@halfdomelabs/core-generators';

import {
  createNodePackagesTask,
  extractPackageVersions,
  makeImportAndFilePath,
  projectScope,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import path from 'node:path';
import { z } from 'zod';

import { REACT_PACKAGES } from '@src/constants/react-packages.js';

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
  buildTasks: () => [
    createNodePackagesTask({
      prod: extractPackageVersions(REACT_PACKAGES, ['loglevel']),
    }),
    createGeneratorTask({
      name: 'main',
      dependencies: {
        react: reactProvider,
        typescript: typescriptProvider,
      },
      exports: {
        reactLogger: reactLoggerProvider.export(projectScope),
      },
      run({ react, typescript }) {
        const [fileImport, filePath] = makeImportAndFilePath(
          path.join(react.getSrcFolder(), 'services/logger.ts'),
        );

        return {
          providers: {
            reactLogger: {
              getLoggerExpression: () =>
                TypescriptCodeUtils.createExpression(
                  'logger',
                  `import { logger  } from "@/${react.getSrcFolder()}/services/logger";`,
                ),
              getImportMap: () => ({
                '%react-logger': {
                  path: fileImport,
                  allowedImports: ['logger'],
                },
              }),
            },
          },
          build: async (builder) => {
            await builder.apply(
              typescript.createCopyAction({
                source: 'logger.ts',
                destination: filePath,
              }),
            );
          },
        };
      },
    }),
  ],
});
