import {
  ImportMapper,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createProviderType,
  createTaskConfigBuilder,
} from '@halfdomelabs/sync';
import { z } from 'zod';

const descriptorSchema = z.object({});

interface UtilConfig {
  file: string;
  exports: string[];
  dependencies?: string[];
}

const UTIL_CONFIG_MAP: Record<string, UtilConfig> = {
  safeLocalStorage: {
    file: 'safe-local-storage.ts',
    exports: ['getSafeLocalStorage'],
    dependencies: [],
  },
};

export type ReactUtilsProvider = ImportMapper;

export const reactUtilsProvider =
  createProviderType<ReactUtilsProvider>('react-utils');

const createMainTask = createTaskConfigBuilder(() => ({
  name: 'main',
  dependencies: {
    typescript: typescriptProvider,
  },
  exports: {
    reactUtils: reactUtilsProvider,
  },
  run({ typescript }) {
    const usedTemplates: Record<string, boolean> = {};

    return {
      getProviders: () => ({
        reactUtils: {
          getImportMap: () =>
            Object.entries(UTIL_CONFIG_MAP).reduce(
              (acc, [key, config]) => ({
                ...acc,
                [`%react-utils/${key}`]: {
                  path: `@/src/utils/${config.file.replace(/\.ts$/, '')}`,
                  allowedImports: config.exports,
                  onImportUsed: () => {
                    usedTemplates[key] = true;
                  },
                },
              }),
              {},
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
}));

const ReactUtilsGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createMainTask(descriptor));
  },
});

export default ReactUtilsGenerator;
