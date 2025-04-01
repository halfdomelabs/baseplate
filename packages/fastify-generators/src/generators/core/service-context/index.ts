import type {
  ImportMapper,
  TypescriptCodeExpression,
} from '@halfdomelabs/core-generators';

import {
  makeImportAndFilePath,
  projectScope,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createNonOverwriteableMap,
  createOutputProviderType,
  createProviderType,
} from '@halfdomelabs/sync';
import { mapValues } from 'es-toolkit';
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
  createOutputProviderType<ServiceContextProvider>('service-context');

export const serviceContextGenerator = createGenerator({
  name: 'core/service-context',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks(taskBuilder) {
    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        typescript: typescriptProvider,
      },
      exports: {
        serviceContextSetup: serviceContextSetupProvider.export(projectScope),
      },
      outputs: {
        serviceContext: serviceContextProvider.export(projectScope),
      },
      run({ typescript }) {
        const contextFieldsMap = createNonOverwriteableMap<
          Record<string, ContextField>
        >({}, { name: 'service-context-fields' });

        const [contextImport, contextPath] = makeImportAndFilePath(
          'src/utils/service-context.ts',
        );

        const [testHelperImport, testHelperPath] = makeImportAndFilePath(
          'src/tests/helpers/service-context.test-helper.ts',
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
          providers: {
            serviceContextSetup: {
              addContextField: (name, config) => {
                contextFieldsMap.set(name, config);
              },
              getImportMap: () => importMap,
              getContextPath: () => contextPath,
            },
          },
          build: async (builder) => {
            const contextFields = contextFieldsMap.value();

            const contextArgs = Object.values(contextFields).flatMap(
              (f) => f.contextArg ?? [],
            );

            const contextFile = typescript.createTemplate({
              CONTEXT_FIELDS:
                Object.keys(contextFields).length === 0
                  ? TypescriptCodeUtils.createExpression('placeholder?: never')
                  : TypescriptCodeUtils.mergeBlocksAsInterfaceContent(
                      mapValues(contextFields, (field) => field.type),
                    ),
              CREATE_CONTEXT_ARGS:
                contextArgs.length === 0
                  ? TypescriptCodeUtils.createExpression('')
                  : TypescriptCodeUtils.mergeExpressions(
                      contextArgs.map((arg) =>
                        arg.type.wrap((contents) => `${arg.name}: ${contents}`),
                      ),
                      '; ',
                    ).wrap(
                      (contents) => `
            {${contextArgs.map((a) => a.name).join(', ')}}: {${contents}}
          `,
                    ),
              CONTEXT_OBJECT: TypescriptCodeUtils.mergeExpressionsAsObject(
                mapValues(contextFields, (field) => field.value),
              ),
            });

            await builder.apply(
              contextFile.renderToAction('service-context.ts', contextPath),
            );

            const testHelperFile = typescript.createTemplate(
              {
                TEST_ARGS:
                  contextArgs.length === 0
                    ? TypescriptCodeUtils.createExpression('')
                    : TypescriptCodeUtils.mergeExpressions(
                        contextArgs.map((arg) =>
                          arg.type.wrap(
                            (contents) =>
                              `${arg.name}${arg.testDefault ? '?' : ''}: ${contents}`,
                          ),
                        ),
                        '; ',
                      ).wrap(
                        (contents) => `
            {${contextArgs.map((a) => a.name).join(', ')}}: {${contents}} = {}
          `,
                      ),
                TEST_OBJECT:
                  contextArgs.length === 0
                    ? TypescriptCodeUtils.createExpression('')
                    : TypescriptCodeUtils.mergeExpressionsAsObject(
                        Object.fromEntries(
                          contextArgs.map((arg) => [
                            arg.name,
                            arg.testDefault
                              ? arg.testDefault.prepend(`${arg.name} ?? `)
                              : TypescriptCodeUtils.createExpression(arg.name),
                          ]),
                        ),
                      ),
              },
              { importMappers: [{ getImportMap: () => importMap }] },
            );

            await builder.apply(
              testHelperFile.renderToAction(
                'service-context.test-helper.ts',
                testHelperPath,
              ),
            );

            return {
              serviceContext: {
                getImportMap: () => importMap,
                getContextPath: () => contextPath,
                getServiceContextType: () =>
                  TypescriptCodeUtils.createExpression(
                    'ServiceContext',
                    `import {ServiceContext} from '${contextImport}'`,
                  ),
              },
            };
          },
        };
      },
    });
  },
});
