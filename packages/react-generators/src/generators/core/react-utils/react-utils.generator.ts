import type { TemplateFileSource } from '@halfdomelabs/sync';

import {
  projectScope,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import path from 'node:path';
import { z } from 'zod';

import {
  createReactUtilsImports,
  reactUtilsImportsProvider,
} from './generated/ts-import-maps.js';
import { REACT_UTILS_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({});

function getUtilsPath(source: TemplateFileSource): string {
  if (!('path' in source)) {
    throw new Error('Template path is required');
  }
  return path.join('@/src/utils', source.path);
}

type ReactUtilKey = keyof typeof REACT_UTILS_TS_TEMPLATES;

export const reactUtilsGenerator = createGenerator({
  name: 'core/react-utils',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
      },
      exports: {
        reactUtilsImports: reactUtilsImportsProvider.export(projectScope),
      },
      run({ typescriptFile }) {
        return {
          providers: {
            reactUtilsImports: createReactUtilsImports('@/src/utils'),
          },
          build: (builder) => {
            for (const key of Object.keys(REACT_UTILS_TS_TEMPLATES)) {
              const template = REACT_UTILS_TS_TEMPLATES[key as ReactUtilKey];
              typescriptFile.addLazyTemplateFile({
                template,
                destination: getUtilsPath(template.source),
                generatorInfo: builder.generatorInfo,
              });
            }
          },
        };
      },
    }),
  }),
});

export { reactUtilsImportsProvider } from './generated/ts-import-maps.js';
