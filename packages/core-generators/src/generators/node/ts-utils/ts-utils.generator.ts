import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { typescriptFileProvider } from '../typescript/typescript.generator.js';
import { NODE_TS_UTILS_PATHS } from './generated/template-paths.js';
import { nodeTsUtilsImportsTask } from './generated/ts-import-providers.js';
import { NODE_TS_UTILS_TEMPLATES } from './generated/typed-templates.js';

const descriptorSchema = z.object({});

type TsUtilKey = keyof typeof NODE_TS_UTILS_TEMPLATES;

export const tsUtilsGenerator = createGenerator({
  name: 'node/ts-utils',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: NODE_TS_UTILS_PATHS.task,
    imports: nodeTsUtilsImportsTask,
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        paths: NODE_TS_UTILS_PATHS.provider,
      },
      run({ typescriptFile, paths }) {
        return {
          build: (builder) => {
            for (const key of Object.keys(NODE_TS_UTILS_TEMPLATES)) {
              const template = NODE_TS_UTILS_TEMPLATES[key as TsUtilKey];
              typescriptFile.addLazyTemplateFile({
                template,
                destination: paths[key as TsUtilKey],
                generatorInfo: builder.generatorInfo,
              });
            }
          },
        };
      },
    }),
  }),
});

export { tsUtilsImportsProvider } from './generated/ts-import-providers.js';
export type { TsUtilsImportsProvider } from './generated/ts-import-providers.js';
