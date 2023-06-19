import path from 'path';
import {
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithChildren,
  createNonOverwriteableMap,
} from '@halfdomelabs/sync';
import { paramCase } from 'change-case';
import * as R from 'ramda';
import { z } from 'zod';
import { appModuleProvider } from '../root-module/index.js';

const descriptorSchema = z.object({
  name: z.string().min(1),
  folderName: z.string().optional(),
});

const AppModuleGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    appModule: appModuleProvider,
    typescript: typescriptProvider,
  },
  exports: {
    appModule: appModuleProvider,
  },
  createGenerator(descriptor, { appModule, typescript }) {
    const folderName = descriptor.folderName || paramCase(descriptor.name);
    const moduleName = `${descriptor.name}Module`;
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
        `import {${moduleName}} from '@/${moduleFolder}'`
      )
    );

    return {
      getProviders: () => ({
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
      }),
      build: async (builder) => {
        const indexFile = typescript.createTemplate({
          MODULE_CONTENTS: { type: 'code-expression' },
        });

        indexFile.addCodeExpression(
          'MODULE_CONTENTS',
          TypescriptCodeUtils.mergeExpressionsAsObject(
            R.mapObjIndexed(
              (types) => TypescriptCodeUtils.mergeExpressionsAsArray(types),
              moduleEntries.value()
            )
          )
        );

        indexFile.addCodeAddition({
          importText: moduleImports.map((name) => `import '${name}'`),
        });

        const moduleFolderIndex = path.join(moduleFolder, 'index.ts');
        await builder.apply(
          indexFile.renderToActionFromText(
            `export const ${moduleName} = MODULE_CONTENTS`,
            moduleFolderIndex
          )
        );
      },
    };
  },
});

export default AppModuleGenerator;
