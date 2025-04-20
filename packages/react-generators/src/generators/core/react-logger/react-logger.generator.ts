import type { ImportMapper } from '@halfdomelabs/core-generators';

import {
  createNodePackagesTask,
  extractPackageVersions,
  projectScope,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { REACT_PACKAGES } from '@src/constants/react-packages.js';

import {
  createReactLoggerImports,
  reactLoggerImportsProvider,
} from './generated/ts-import-maps.js';
import { CORE_REACT_LOGGER_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({});

export type ReactLoggerProvider = ImportMapper;

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
        typescriptFile: typescriptFileProvider,
      },
      exports: {
        reactLogger: reactLoggerProvider.export(projectScope),
        reactLoggerImports: reactLoggerImportsProvider.export(projectScope),
      },
      run({ typescriptFile }) {
        return {
          providers: {
            reactLogger: {
              getImportMap: () => ({
                '%react-logger': {
                  path: '@/src/services/logger',
                  allowedImports: ['logger'],
                },
              }),
            },
            reactLoggerImports: createReactLoggerImports('@/src/services'),
          },
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: CORE_REACT_LOGGER_TS_TEMPLATES.logger,
                destination: '@/src/services/logger.ts',
              }),
            );
          },
        };
      },
    }),
  }),
});

export { reactLoggerImportsProvider } from './generated/ts-import-maps.js';
