import type { ImportMapper } from '@halfdomelabs/core-generators';

import {
  projectScope,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
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
    reactUtils: reactUtilsProvider.export(projectScope),
  },
  run({ typescript }) {
    const usedTemplates: Record<string, boolean> = {};

    return {
      getProviders: () => ({
        reactUtils: {
          getImportMap: () =>
            Object.fromEntries(
              Object.entries(UTIL_CONFIG_MAP).map(([key, config]) => [
                `%react-utils/${key}`,
                {
                  path: `@/src/utils/${config.file.replace(/\.ts$/, '')}`,
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
}));

export const reactUtilsGenerator = createGenerator({
  name: 'core/react-utils',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createMainTask(descriptor));
  },
});
