import type { TemplateFileSource } from '@baseplate-dev/sync';

import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import path from 'node:path';
import { z } from 'zod';

import { projectScope } from '#src/providers/scopes.js';

import { typescriptFileProvider } from '../typescript/typescript.generator.js';
import {
  createTsUtilsImports,
  tsUtilsImportsProvider,
} from './generated/ts-import-maps.js';
import { NODE_TS_UTILS_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({});

function getUtilsPath(source: TemplateFileSource): string {
  if (!('path' in source)) {
    throw new Error('Template path is required');
  }
  return path.join('@/src/utils', source.path);
}

type TsUtilKey = keyof typeof NODE_TS_UTILS_TS_TEMPLATES;

export const tsUtilsGenerator = createGenerator({
  name: 'node/ts-utils',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
      },
      exports: {
        tsUtilsImports: tsUtilsImportsProvider.export(projectScope),
      },
      run({ typescriptFile }) {
        return {
          providers: {
            tsUtilsImports: createTsUtilsImports('@/src/utils'),
          },
          build: (builder) => {
            for (const key of Object.keys(NODE_TS_UTILS_TS_TEMPLATES)) {
              const template = NODE_TS_UTILS_TS_TEMPLATES[key as TsUtilKey];
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

export { tsUtilsImportsProvider } from './generated/ts-import-maps.js';
export type { TsUtilsImportsProvider } from './generated/ts-import-maps.js';
