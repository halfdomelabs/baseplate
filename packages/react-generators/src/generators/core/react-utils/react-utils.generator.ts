import type { ImportMapper } from '@halfdomelabs/core-generators';
import type { TemplateFileSource } from '@halfdomelabs/sync';

import {
  projectScope,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import path from 'node:path';
import { z } from 'zod';

import {
  createReactUtilsImports,
  reactUtilsImportsProvider,
} from './generated/ts-import-maps.js';
import { REACT_UTILS_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({});

type ReactUtilsProvider = ImportMapper;

export const reactUtilsProvider =
  createProviderType<ReactUtilsProvider>('react-utils');

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
        reactUtils: reactUtilsProvider.export(projectScope),
        reactUtilsImports: reactUtilsImportsProvider.export(projectScope),
      },
      run({ typescriptFile }) {
        const usedTemplates = new Set<ReactUtilKey>();

        const files = Object.entries(REACT_UTILS_TS_TEMPLATES).map(
          ([key, template]) => ({
            key,
            template,
          }),
        );

        return {
          providers: {
            reactUtils: {
              getImportMap: () =>
                Object.fromEntries(
                  files.map(({ key, template }) => [
                    `%react-utils/${key}`,
                    {
                      path: getUtilsPath(template.source),
                      allowedImports: Object.keys(
                        template.projectExports ?? {},
                      ),
                      onImportUsed: () => {
                        usedTemplates.add(key as ReactUtilKey);
                      },
                    },
                  ]),
                ),
            },
            reactUtilsImports: createReactUtilsImports('@/src/utils'),
          },
          build: async (builder) => {
            // render all ts-utils files that were used
            await Promise.all(
              [...usedTemplates].map((key) => {
                const template = REACT_UTILS_TS_TEMPLATES[key];
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
              REACT_UTILS_TS_TEMPLATES,
            ).filter((key) => !usedTemplates.has(key as ReactUtilKey));

            for (const key of unusedTemplates) {
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
