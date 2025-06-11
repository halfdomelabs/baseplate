import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { typescriptFileProvider } from '../typescript/typescript.generator.js';
import { NODE_TS_UTILS_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

type TsUtilKey = keyof typeof NODE_TS_UTILS_GENERATED.templates;

export const tsUtilsGenerator = createGenerator({
  name: 'node/ts-utils',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: NODE_TS_UTILS_GENERATED.paths.task,
    imports: NODE_TS_UTILS_GENERATED.imports.task,
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        paths: NODE_TS_UTILS_GENERATED.paths.provider,
      },
      run({ typescriptFile, paths }) {
        return {
          build: (builder) => {
            for (const key of Object.keys(NODE_TS_UTILS_GENERATED.templates)) {
              const template =
                NODE_TS_UTILS_GENERATED.templates[key as TsUtilKey];
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
