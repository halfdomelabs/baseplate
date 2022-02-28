import {
  createProviderType,
  createGeneratorWithChildren,
} from '@baseplate/sync';
import * as yup from 'yup';
import { copyTypescriptFileAction } from '../../../actions';
import { TypescriptCodeExpression } from '../../../writers/typescript';

const descriptorSchema = yup.object({});

export const tsUtilsProvider = createProviderType<TsUtilsProvider>('ts-utils');

interface UtilConfig {
  export: string;
  file: string;
}

function createConfigMap<T extends Record<string, UtilConfig>>(map: T): T {
  return map;
}

const UTIL_CONFIGS = createConfigMap({
  normalizeTypes: {
    export: 'NormalizeTypes',
    file: 'normalizeTypes.ts',
  },
  restrictNulls: {
    export: 'restrictNulls',
    file: 'nulls.ts',
  },
  capitalizeString: {
    export: 'capitalizeString',
    file: 'string.ts',
  },
});

type ConfigKey = keyof typeof UTIL_CONFIGS;

export interface TsUtilsProvider {
  getUtilExpression(key: ConfigKey): TypescriptCodeExpression;
}

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
  createGenerator(descriptor, dependencies) {
    const usedTemplates: Record<string, boolean> = {};

    return {
      getProviders: () => ({
        tsUtils: {
          getUtilExpression(key) {
            const config = UTIL_CONFIGS[key];
            if (!config) {
              throw new Error(`No config for key ${key}`);
            }
            usedTemplates[config.file] = true;
            return new TypescriptCodeExpression(
              config.export,
              `import { ${
                config.export
              } } from '@/src/utils/${config.file.replace(/\.ts$/, '')}'`
            );
          },
        },
      }),
      build: async (builder) => {
        // Copy all the util files that were used
        const templateFiles = Object.keys(usedTemplates);

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
