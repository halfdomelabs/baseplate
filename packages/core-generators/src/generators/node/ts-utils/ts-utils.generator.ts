import type { TemplateFileSource } from '@halfdomelabs/sync';

import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import path from 'node:path';
import { z } from 'zod';

import { projectScope } from '@src/providers/scopes.js';

import type { ImportMapper } from '../../../providers/index.js';

import { typescriptFileProvider } from '../typescript/typescript.generator.js';
import {
  createTsUtilsImports,
  tsUtilsImportsProvider,
} from './generated/ts-import-maps.js';
import { NODE_TS_UTILS_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({});

export type TsUtilsProvider = ImportMapper;

export const tsUtilsProvider = createProviderType<TsUtilsProvider>('ts-utils');

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
        tsUtils: tsUtilsProvider.export(projectScope),
        tsUtilsImports: tsUtilsImportsProvider.export(projectScope),
      },
      run({ typescriptFile }) {
        const usedTemplates = new Set<TsUtilKey>();

        const files = Object.entries(NODE_TS_UTILS_TS_TEMPLATES).map(
          ([key, template]) => ({
            key,
            template,
          }),
        );

        return {
          providers: {
            tsUtils: {
              getImportMap: () =>
                Object.fromEntries(
                  files.map(({ key, template }) => [
                    `%ts-utils/${key}`,
                    {
                      path: getUtilsPath(template.source),
                      allowedImports: Object.keys(
                        template.projectExports ?? {},
                      ),
                      onImportUsed: () => {
                        usedTemplates.add(key as TsUtilKey);
                      },
                    },
                  ]),
                ),
            },
            tsUtilsImports: createTsUtilsImports('@/src/utils'),
          },
          build: async (builder) => {
            // render all ts-utils files that were used
            await Promise.all(
              [...usedTemplates].map((key) => {
                const template = NODE_TS_UTILS_TS_TEMPLATES[key];
                return builder.apply(
                  typescriptFile.renderTemplateFile({
                    template,
                    destination: getUtilsPath(template.source),
                  }),
                );
              }),
            );

            // add all remaining files as lazy files
            const unusedTemplates = Object.keys(
              NODE_TS_UTILS_TS_TEMPLATES,
            ).filter((key) => !usedTemplates.has(key as TsUtilKey));

            for (const key of unusedTemplates) {
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
