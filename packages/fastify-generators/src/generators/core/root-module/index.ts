import type {
  ImportMapper,
  TypescriptCodeExpression,
} from '@halfdomelabs/core-generators';

import {
  projectScope,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { safeMergeAllWithOptions } from '@halfdomelabs/utils';
import { mapValues } from 'es-toolkit';
import { z } from 'zod';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

export interface RootModuleProvider {
  addModuleField: (name: string, type: TypescriptCodeExpression) => void;
  getRootModule: () => TypescriptCodeExpression;
}

export const rootModuleProvider =
  createProviderType<RootModuleProvider>('root-module');

const [setupTask, rootModuleConfigProvider, rootModuleSetupProvider] =
  createConfigProviderTask(
    (t) => ({
      moduleFields: t.map<string, TypescriptCodeExpression>(),
    }),
    {
      prefix: 'root-module',
      configScope: projectScope,
    },
  );

export { rootModuleConfigProvider };

export interface RootModuleImport extends ImportMapper {
  getRootModule: () => TypescriptCodeExpression;
  getRootModuleImport: () => string;
}

export const rootModuleImportProvider = createProviderType<RootModuleImport>(
  'root-module-import',
  {
    isReadOnly: true,
  },
);

export interface AppModuleProvider {
  getModuleFolder(): string;
  addModuleImport: (name: string) => void;
  registerFieldEntry: (name: string, type: TypescriptCodeExpression) => void;
  getValidFields(): string[];
}

export const appModuleProvider =
  createProviderType<AppModuleProvider>('app-module');

export const rootModuleGenerator = createGenerator({
  name: 'core/root-module',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => [
    createGeneratorTask(setupTask),
    createGeneratorTask({
      name: 'rootModuleImport',
      exports: {
        rootModuleImport: rootModuleImportProvider.export(projectScope),
      },
      run() {
        return {
          providers: {
            rootModuleImport: {
              getRootModule: () =>
                TypescriptCodeUtils.createExpression(
                  'RootModule',
                  "import { RootModule } from '@/src/modules/index.js'",
                ),
              getRootModuleImport: () => `@/src/modules/index.js`,
              getImportMap: () => ({
                '%root-module': {
                  path: '@/src/modules/index.js',
                  allowedImports: ['RootModule'],
                },
              }),
            },
          },
        };
      },
    }),
    createGeneratorTask({
      name: 'appModule',
      dependencies: {
        typescript: typescriptProvider,
        rootModuleSetup: rootModuleSetupProvider,
      },
      exports: { appModule: appModuleProvider.export(projectScope) },
      run({ typescript, rootModuleSetup: { moduleFields: moduleFieldsMap } }) {
        const rootModuleEntries = new Map<string, TypescriptCodeExpression[]>();
        const moduleImports: string[] = [];

        return {
          providers: {
            appModule: {
              getModuleFolder: () => 'src/modules',
              getValidFields: () => ['children', ...moduleFieldsMap.keys()],
              addModuleImport(name) {
                moduleImports.push(name);
              },
              registerFieldEntry: (name, type) => {
                if (name !== 'children' && !moduleFieldsMap.get(name)) {
                  throw new Error(`Unknown field entry: ${name}`);
                }
                const existing = rootModuleEntries.get(name) ?? [];
                rootModuleEntries.set(name, [...existing, type]);
              },
            },
          },
          build: async (builder) => {
            const rootModule = typescript.createTemplate({
              ROOT_MODULE_CONTENTS: { type: 'code-expression' },
            });

            rootModule.addCodeExpression(
              'ROOT_MODULE_CONTENTS',
              TypescriptCodeUtils.mergeExpressionsAsObject(
                mapValues(Object.fromEntries(rootModuleEntries), (types) =>
                  TypescriptCodeUtils.mergeExpressionsAsArray(types),
                ),
              ),
            );

            await builder.apply(
              rootModule.renderToAction('index.ts', 'src/modules/index.ts'),
            );

            const moduleHelper = typescript.createTemplate({
              MODULE_FIELDS: { type: 'code-block' },
              MODULE_MERGER: { type: 'code-expression' },
            });

            const moduleFields = [...moduleFieldsMap.entries()].map(
              ([name, field]) => ({ name, field }),
            );

            moduleHelper.addCodeAddition({
              importText: moduleImports.map((name) => `import '${name}'`),
            });

            moduleHelper.addCodeBlock(
              'MODULE_FIELDS',
              TypescriptCodeUtils.mergeBlocks(
                moduleFields.map(({ name, field }) => {
                  const wrapper = TypescriptCodeUtils.createWrapper(
                    (contents) => `${name}?: ${contents}[]`,
                  );
                  return TypescriptCodeUtils.toBlock(
                    TypescriptCodeUtils.wrapExpression(field, wrapper),
                  );
                }),
              ),
            );

            const mergers = safeMergeAllWithOptions(
              moduleFields.map(({ name }) => ({
                [name]: TypescriptCodeUtils.createExpression(
                  `[...(prev.${name} ?? []), ...(current.${name} ?? [])]`,
                ),
              })),
            );

            moduleHelper.addCodeExpression(
              'MODULE_MERGER',
              TypescriptCodeUtils.mergeExpressionsAsObject(mergers, {
                wrapWithParenthesis: true,
              }),
            );

            await builder.apply(
              moduleHelper.renderToAction(
                'app-modules.ts',
                'src/utils/app-modules.ts',
              ),
            );
          },
        };
      },
    }),
  ],
});
