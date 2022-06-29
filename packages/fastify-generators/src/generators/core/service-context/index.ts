import {
  ImportMapper,
  makeImportAndFilePath,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createGeneratorWithChildren,
  createNonOverwriteableMap,
  createProviderType,
} from '@baseplate/sync';
import R from 'ramda';
import { z } from 'zod';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

interface ContextField {
  type: TypescriptCodeExpression;
  value: TypescriptCodeExpression;
  contextArg?: { name: string; type: TypescriptCodeExpression }[];
}

export interface ServiceContextSetupProvider extends ImportMapper {
  addContextField(name: string, field: ContextField): void;
  getContextPath(): string;
}

export const serviceContextSetupProvider =
  createProviderType<ServiceContextSetupProvider>('service-context-setup');

export interface ServiceContextProvider extends ImportMapper {
  getContextPath(): string;
}

export const serviceContextProvider =
  createProviderType<ServiceContextProvider>('service-context');

const ServiceContextGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    typescript: typescriptProvider,
  },
  exports: {
    serviceContextSetup: serviceContextSetupProvider,
    serviceContext: serviceContextProvider
      .export()
      .dependsOn(serviceContextSetupProvider),
  },
  createGenerator(descriptor, { typescript }) {
    const contextFieldsMap = createNonOverwriteableMap<
      Record<string, ContextField>
    >({}, { name: 'service-context-fields' });

    const [contextImport, contextPath] = makeImportAndFilePath(
      'src/utils/service-context.ts'
    );

    const importMap = {
      '%service-context': {
        path: contextImport,
        allowedImports: ['ServiceContext', 'createServiceContext'],
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
        serviceContext: {
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
      },
    };
  },
});

export default ServiceContextGenerator;
