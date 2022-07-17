import {
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createGeneratorWithTasks,
  createNonOverwriteableMap,
  createProviderType,
} from '@baseplate/sync';
import R from 'ramda';
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

export interface AppModuleProvider {
  getModuleFolder(): string;
  registerFieldEntry: (
    name: 'children' | string,
    type: TypescriptCodeExpression
  ) => void;
  getValidFields(): string[];
}

export const appModuleProvider =
  createProviderType<AppModuleProvider>('app-module');

const RootModuleGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder) {
    const rootModuleTask = taskBuilder.addTask({
      name: 'rootModule',
      exports: { rootModule: rootModuleProvider },
      run() {
        const moduleFieldMap = createNonOverwriteableMap<
          Record<string, TypescriptCodeExpression>
        >({}, { name: 'root-module-fields' });

        return {
          getProviders() {
            return {
              rootModule: {
                addModuleField: (name, type) => {
                  moduleFieldMap.set(name, type);
                },
                getRootModule: () =>
                  TypescriptCodeUtils.createExpression(
                    'RootModule',
                    "import { RootModule } from '@/src/modules'"
                  ),
              },
            };
          },
          build: () => ({ moduleFieldMap }),
        };
      },
    });

    taskBuilder.addTask({
      name: 'appModule',
      dependencies: { typescript: typescriptProvider },
      exports: { appModule: appModuleProvider },
      run({ typescript }) {
        const rootModuleEntries = createNonOverwriteableMap<
          Record<string, TypescriptCodeExpression[]>
        >({}, { name: 'root-module-entries' });
        const { moduleFieldMap } = rootModuleTask.getOutput();

        return {
          getProviders: () => ({
            appModule: {
              getModuleFolder: () => 'src/modules',
              getValidFields: () => [
                'children',
                ...Object.keys(moduleFieldMap.value()),
              ],
              registerFieldEntry: (name, type) => {
                if (name !== 'children' && !moduleFieldMap.get(name)) {
                  throw new Error(`Unknown field entry: ${name}`);
                }
                rootModuleEntries.appendUnique(name, [type]);
              },
            },
          }),
          build: async (builder) => {
            const rootModule = typescript.createTemplate({
              ROOT_MODULE_CONTENTS: { type: 'code-expression' },
            });

            rootModule.addCodeExpression(
              'ROOT_MODULE_CONTENTS',
              TypescriptCodeUtils.mergeExpressionsAsObject(
                R.mapObjIndexed(
                  (types) => TypescriptCodeUtils.mergeExpressionsAsArray(types),
                  rootModuleEntries.value()
                )
              )
            );

            await builder.apply(
              rootModule.renderToAction('index.ts', 'src/modules/index.ts')
            );

            const moduleHelper = typescript.createTemplate({
              MODULE_FIELDS: { type: 'code-block' },
              MODULE_MERGER: { type: 'code-expression' },
            });

            const moduleFields = Object.keys(moduleFieldMap.value()).map(
              (name) => {
                const field = moduleFieldMap.get(
                  name
                ) as TypescriptCodeExpression;
                return { name, field };
              }
            );

            moduleHelper.addCodeBlock(
              'MODULE_FIELDS',
              TypescriptCodeUtils.mergeBlocks(
                moduleFields.map(({ name, field }) => {
                  const wrapper = TypescriptCodeUtils.createWrapper(
                    (contents) => `${name}?: ${contents}[]`
                  );
                  return TypescriptCodeUtils.toBlock(
                    TypescriptCodeUtils.wrapExpression(field, wrapper)
                  );
                })
              )
            );

            const mergers = R.mergeAll(
              moduleFields.map(({ name }) => ({
                [name]: TypescriptCodeUtils.createExpression(
                  `[...(prev.${name} || []), ...(current.${name} || [])]`
                ),
              }))
            );

            moduleHelper.addCodeExpression(
              'MODULE_MERGER',
              TypescriptCodeUtils.mergeExpressionsAsObject(mergers, {
                wrapWithParenthesis: true,
              })
            );

            await builder.apply(
              moduleHelper.renderToAction(
                'app-modules.ts',
                'src/utils/app-modules.ts'
              )
            );
          },
        };
      },
    });
  },
});

export default RootModuleGenerator;
