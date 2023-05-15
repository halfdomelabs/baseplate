import {
  createProviderType,
  createGeneratorWithChildren,
} from '@halfdomelabs/sync';
import { z } from 'zod';
import { copyTypescriptFileAction } from '../../../actions';
import { ImportMapper } from '../../../providers';

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
const TsUtilsGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {},
  exports: {
    tsUtils: tsUtilsProvider,
  },
  createGenerator() {
    const usedTemplates: Record<string, boolean> = {};

    return {
      getProviders: () => ({
        tsUtils: {
          getImportMap: () =>
            Object.entries(UTIL_CONFIG_MAP).reduce(
              (acc, [key, config]) => ({
                ...acc,
                [`%ts-utils/${key}`]: {
                  path: `@/src/utils/${config.file.replace(/\.ts$/, '')}`,
                  allowedImports: config.exports,
                  onImportUsed: () => {
                    usedTemplates[key] = true;
                  },
                },
              }),
              {}
            ),
        },
      }),
      build: async (builder) => {
        // recursively resolve dependencies
        const markDependenciesAsUsed = (key: string): void => {
          const config = UTIL_CONFIG_MAP[key];
          config.dependencies?.forEach((dep) => {
            usedTemplates[dep] = true;
            markDependenciesAsUsed(dep);
          });
        };
        Object.keys(usedTemplates).forEach(markDependenciesAsUsed);
        // Copy all the util files that were used
        const templateFiles = Object.keys(usedTemplates).map(
          (key) => UTIL_CONFIG_MAP[key].file
        );

        await Promise.all(
          templateFiles.map((file) =>
            builder.apply(
              copyTypescriptFileAction({
                source: file,
                destination: `src/utils/${file}`,
              })
            )
          )
        );
      },
    };
  },
});

export default TsUtilsGenerator;
