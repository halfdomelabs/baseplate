import {
  createGeneratorWithTasks,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { projectScope } from '@src/providers/scopes.js';

import type { ImportMapper } from '../../../providers/index.js';

import { typescriptProvider } from '../typescript/index.js';

const descriptorSchema = z.object({});

interface UtilConfig {
  file: string;
  exports: string[];
  dependencies?: string[];
}

const UTIL_CONFIG_MAP: Record<string, UtilConfig> = {
  arrays: {
    file: 'arrays.ts',
    exports: ['notEmpty'],
    dependencies: [],
  },
  normalizeTypes: {
    file: 'normalizeTypes.ts',
    exports: ['NormalizeTypes'],
    dependencies: [],
  },
  nulls: {
    file: 'nulls.ts',
    exports: ['restrictObjectNulls'],
    dependencies: ['normalizeTypes'],
  },
  string: {
    file: 'string.ts',
    exports: ['capitalizeString'],
    dependencies: [],
  },
  typedEventEmitter: {
    file: 'typedEventEmitter.ts',
    exports: ['TypedEventEmitter', 'createTypedEventEmitter'],
    dependencies: [],
  },
};

export type TsUtilsProvider = ImportMapper;

export const tsUtilsProvider = createProviderType<TsUtilsProvider>('ts-utils');

/**
 * Generator for Typescript utility functions like notEmpty
 */
const TsUtilsGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder) {
    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        typescript: typescriptProvider,
      },
      exports: {
        tsUtils: tsUtilsProvider.export(projectScope),
      },
      run({ typescript }) {
        const usedTemplates: Record<string, boolean> = {};

        return {
          getProviders: () => ({
            tsUtils: {
              getImportMap: () =>
                Object.fromEntries(
                  Object.entries(UTIL_CONFIG_MAP).map(([key, config]) => [
                    `%ts-utils/${key}`,
                    {
                      path: `@/src/utils/${config.file.replace(/\.ts$/, '.js')}`,
                      allowedImports: config.exports,
                      onImportUsed: () => {
                        usedTemplates[key] = true;
                      },
                    },
                  ]),
                ),
            },
          }),
          build: async (builder) => {
            // recursively resolve dependencies
            const markDependenciesAsUsed = (key: string): void => {
              const config = UTIL_CONFIG_MAP[key];
              if (config.dependencies)
                for (const dep of config.dependencies) {
                  usedTemplates[dep] = true;
                  markDependenciesAsUsed(dep);
                }
            };
            for (const key of Object.keys(usedTemplates)) {
              markDependenciesAsUsed(key);
            }
            // Copy all the util files that were used
            const templateFiles = Object.keys(usedTemplates).map(
              (key) => UTIL_CONFIG_MAP[key].file,
            );

            await Promise.all(
              templateFiles.map((file) =>
                builder.apply(
                  typescript.createCopyAction({
                    source: file,
                    destination: `src/utils/${file}`,
                  }),
                ),
              ),
            );
          },
        };
      },
    });
  },
});

export default TsUtilsGenerator;
