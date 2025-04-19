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
import { z } from 'zod';

import { REACT_PACKAGES } from '@src/constants/react-packages.js';

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
  buildTasks: () => ({
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(REACT_PACKAGES, ['loglevel']),
    }),
    main: createGeneratorTask({
      dependencies: {
        typescript: typescriptProvider,
      },
      exports: {
        reactLogger: reactLoggerProvider.export(projectScope),
      },
      run({ typescript }) {
        const [fileImport, filePath] = makeImportAndFilePath(
          'src/services/logger.ts',
        );

        return {
          providers: {
            reactLogger: {
              getLoggerExpression: () =>
                TypescriptCodeUtils.createExpression(
                  'logger',
                  `import { logger } from "@/src/services/logger";`,
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
  }),
});
