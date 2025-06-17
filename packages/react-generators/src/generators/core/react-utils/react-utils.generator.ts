import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { CORE_REACT_UTILS_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

type ReactUtilKey = keyof typeof CORE_REACT_UTILS_GENERATED.templates;

export const reactUtilsGenerator = createGenerator({
  name: 'core/react-utils',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: CORE_REACT_UTILS_GENERATED.paths.task,
    imports: CORE_REACT_UTILS_GENERATED.imports.task,
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        paths: CORE_REACT_UTILS_GENERATED.paths.provider,
      },
      run({ typescriptFile, paths }) {
        return {
          build: (builder) => {
            for (const key of Object.keys(
              CORE_REACT_UTILS_GENERATED.templates,
            )) {
              const typedKey = key as ReactUtilKey;
              const template = CORE_REACT_UTILS_GENERATED.templates[typedKey];
              typescriptFile.addLazyTemplateFile({
                template,
                destination: paths[typedKey],
                generatorInfo: builder.generatorInfo,
              });
            }
          },
        };
      },
    }),
  }),
});
