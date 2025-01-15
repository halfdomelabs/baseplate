import type { TypescriptCodeExpression } from '@halfdomelabs/core-generators';

import {
  featureScope,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import { createGenerator, createNonOverwriteableMap } from '@halfdomelabs/sync';
import { camelCase, kebabCase } from 'change-case';
import { mapValues } from 'es-toolkit';
import path from 'node:path';
import { z } from 'zod';

import { appModuleProvider } from '../root-module/index.js';

const descriptorSchema = z.object({
  name: z.string().min(1),
  folderName: z.string().optional(),
});

export const appModuleGenerator = createGenerator({
  name: 'core/app-module',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  scopes: [featureScope],
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        appModule: appModuleProvider,
        typescript: typescriptProvider,
      },
      exports: {
        appModule: appModuleProvider.export(featureScope),
      },
      run({ appModule, typescript }) {
        const folderName = descriptor.folderName ?? kebabCase(descriptor.name);
        const moduleName = `${camelCase(descriptor.name)}Module`;
        const moduleFolder = `${appModule.getModuleFolder()}/${folderName}`;
        const moduleEntries = createNonOverwriteableMap<
          Record<string, TypescriptCodeExpression[]>
        >({}, { name: 'app-module-entries' });
        const validFields = appModule.getValidFields();
        const moduleImports: string[] = [];

        appModule.registerFieldEntry(
          'children',
          TypescriptCodeUtils.createExpression(
            moduleName,
            `import {${moduleName}} from '@/${moduleFolder}/index.js'`,
          ),
        );

        return {
          providers: {
            appModule: {
              getModuleFolder: () => moduleFolder,
              getValidFields: () => validFields,
              addModuleImport(name) {
                moduleImports.push(name);
              },
              registerFieldEntry: (name, type) => {
                if (!validFields.includes(name)) {
                  throw new Error(`Unknown field entry: ${name}`);
                }
                moduleEntries.appendUnique(name, [type]);
              },
            },
          },
          build: async (builder) => {
            const indexFile = typescript.createTemplate({
              MODULE_CONTENTS: { type: 'code-expression' },
            });

            indexFile.addCodeExpression(
              'MODULE_CONTENTS',
              TypescriptCodeUtils.mergeExpressionsAsObject(
                mapValues(moduleEntries.value(), (types) =>
                  TypescriptCodeUtils.mergeExpressionsAsArray(types),
                ),
              ),
            );

            indexFile.addCodeAddition({
              importText: moduleImports.map((name) => `import '${name}'`),
            });

            const moduleFolderIndex = path.join(moduleFolder, 'index.ts');
            await builder.apply(
              indexFile.renderToActionFromText(
                `export const ${moduleName} = MODULE_CONTENTS`,
                moduleFolderIndex,
              ),
            );
          },
        };
      },
    });
  },
});
