import {
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  TypescriptSourceFile,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
  createNonOverwriteableMap,
} from '@baseplate/sync';
import R from 'ramda';
import * as yup from 'yup';

const descriptorSchema = yup.object({
  placeholder: yup.string(),
});

export interface AppModuleProvider {
  registerAppModule: (module: TypescriptCodeExpression) => void;
  addModuleField: (name: string, type: TypescriptCodeExpression) => void;
  getRootModule: () => TypescriptCodeExpression;
}

export const appModuleProvider =
  createProviderType<AppModuleProvider>('app-module');

const AppModuleGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {},
  exports: {
    appModule: appModuleProvider,
  },
  createGenerator() {
    const appModules: TypescriptCodeExpression[] = [];
    const moduleFieldMap = createNonOverwriteableMap<
      Record<string, TypescriptCodeExpression>
    >({}, { name: 'app-module-fields' });

    return {
      getProviders: () => ({
        appModule: {
          registerAppModule: (module) => {
            appModules.push(module);
          },
          addModuleField: (name, type) => {
            moduleFieldMap.set(name, type);
          },
          getRootModule: () =>
            TypescriptCodeUtils.createExpression(
              'RootModule',
              "import { RootModule } from '@/src/modules'"
            ),
        },
      }),
      build: async (builder) => {
        const rootModule = new TypescriptSourceFile({
          MODULE_CHILDREN: { type: 'code-expression' },
        });

        rootModule.addCodeExpression(
          'MODULE_CHILDREN',
          TypescriptCodeUtils.mergeExpressionsAsArray(appModules)
        );

        await builder.apply(
          rootModule.renderToAction('index.ts', 'src/modules/index.ts')
        );

        const moduleHelper = new TypescriptSourceFile({
          MODULE_FIELDS: { type: 'code-block' },
          MODULE_MERGER: { type: 'code-expression' },
        });

        const moduleFields = Object.keys(moduleFieldMap.value()).map((name) => {
          const field = moduleFieldMap.get(name) as TypescriptCodeExpression;
          return { name, field };
        });

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

export default AppModuleGenerator;
