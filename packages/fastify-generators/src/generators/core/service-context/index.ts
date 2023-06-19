import {
  ImportMapper,
  makeImportAndFilePath,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createNonOverwriteableMap,
  createProviderType,
} from '@halfdomelabs/sync';
import * as R from 'ramda';
import { z } from 'zod';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

interface ContextField {
  type: TypescriptCodeExpression;
  value: TypescriptCodeExpression;
  contextArg?: {
    name: string;
    type: TypescriptCodeExpression;
    testDefault?: TypescriptCodeExpression;
  }[];
}

export interface ServiceContextSetupProvider extends ImportMapper {
  addContextField(name: string, field: ContextField): void;
  getContextPath(): string;
}

export const serviceContextSetupProvider =
  createProviderType<ServiceContextSetupProvider>('service-context-setup');

export interface ServiceContextProvider extends ImportMapper {
  getContextPath(): string;
  getServiceContextType(): TypescriptCodeExpression;
}

export const serviceContextProvider =
  createProviderType<ServiceContextProvider>('service-context');

const ServiceContextGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder) {
    const setupTask = taskBuilder.addTask({
      name: 'setup',
      dependencies: {
        typescript: typescriptProvider,
      },
      exports: {
        serviceContextSetup: serviceContextSetupProvider,
      },
      run({ typescript }) {
        const contextFieldsMap = createNonOverwriteableMap<
          Record<string, ContextField>
        >({}, { name: 'service-context-fields' });

        const [contextImport, contextPath] = makeImportAndFilePath(
          'src/utils/service-context.ts'
        );

        const [testHelperImport, testHelperPath] = makeImportAndFilePath(
          'src/tests/helpers/service-context.test-helper.ts'
        );

        const importMap = {
          '%service-context': {
            path: contextImport,
            allowedImports: ['ServiceContext', 'createServiceContext'],
          },
          '%service-context/test': {
            path: testHelperImport,
            allowedImports: ['createTestServiceContext'],
          },
        };

        return {
          getProviders: () => ({
            serviceContextSetup: {
              addContextField: (name, config) => {
                contextFieldsMap.set(name, config);
              },
              getImportMap: () => importMap,
              getContextPath: () => contextPath,
            },
          }),
          build: async (builder) => {
            const contextFields = contextFieldsMap.value();

            const contextArgs = Object.values(contextFields).flatMap(
              (f) => f.contextArg || []
            );

            const contextFile = typescript.createTemplate({
              CONTEXT_FIELDS: TypescriptCodeUtils.mergeBlocksAsInterfaceContent(
                R.mapObjIndexed((field) => field.type, contextFields)
              ),
              CREATE_CONTEXT_ARGS: TypescriptCodeUtils.mergeExpressions(
                contextArgs.map((arg) =>
                  arg.type.wrap((contents) => `${arg.name}: ${contents}`)
                ),
                '; '
              ).wrap(
                (contents) => `
            {${contextArgs.map((a) => a.name).join(', ')}}: {${contents}}
          `
              ),
              CONTEXT_OBJECT: TypescriptCodeUtils.mergeExpressionsAsObject(
                R.mapObjIndexed((field) => field.value, contextFields)
              ),
            });

            await builder.apply(
              contextFile.renderToAction('service-context.ts', contextPath)
            );

            const testHelperFile = typescript.createTemplate(
              {
                TEST_ARGS: TypescriptCodeUtils.mergeExpressions(
                  contextArgs.map((arg) =>
                    arg.type.wrap(
                      (contents) =>
                        `${arg.name}${arg.testDefault ? '?' : ''}: ${contents}`
                    )
                  ),
                  '; '
                ).wrap(
                  (contents) => `
            {${contextArgs.map((a) => a.name).join(', ')}}: {${contents}} = {}
          `
                ),
                TEST_OBJECT: TypescriptCodeUtils.mergeExpressionsAsObject(
                  R.fromPairs(
                    contextArgs.map((arg) => [
                      arg.name,
                      arg.testDefault
                        ? arg.testDefault.prepend(`${arg.name} ?? `)
                        : TypescriptCodeUtils.createExpression(arg.name),
                    ])
                  )
                ),
              },
              { importMappers: [{ getImportMap: () => importMap }] }
            );

            await builder.apply(
              testHelperFile.renderToAction(
                'service-context.test-helper.ts',
                testHelperPath
              )
            );

            return { importMap, contextPath, contextImport };
          },
        };
      },
    });

    taskBuilder.addTask({
      name: 'main',
      taskDependencies: { setupTask },
      exports: { serviceContext: serviceContextProvider },
      run(deps, { setupTask: { importMap, contextPath, contextImport } }) {
        return {
          getProviders: () => ({
            serviceContext: {
              getImportMap: () => importMap,
              getContextPath: () => contextPath,
              getServiceContextType: () =>
                TypescriptCodeUtils.createExpression(
                  'ServiceContext',
                  `import {ServiceContext} from '${contextImport}'`
                ),
            },
          }),
        };
      },
    });
  },
});

export default ServiceContextGenerator;
