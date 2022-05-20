import {
  ImportMapper,
  makeImportAndFilePath,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
  createNonOverwriteableMap,
} from '@baseplate/sync';
import R from 'ramda';
import * as yup from 'yup';
import { requestContextProvider } from '../request-context';

const descriptorSchema = yup.object({
  placeholder: yup.string(),
});

interface ContextField {
  type: TypescriptCodeExpression;
  creator: (req: string, reply: string) => TypescriptCodeExpression;
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
    requestContext: requestContextProvider,
  },
  exports: {
    serviceContextSetup: serviceContextSetupProvider,
    serviceContext: serviceContextProvider
      .export()
      .dependsOn(serviceContextSetupProvider),
  },
  createGenerator(descriptor, { typescript, requestContext }) {
    const contextFieldsMap = createNonOverwriteableMap<
      Record<string, ContextField>
    >({}, { name: 'service-context-fields' });

    contextFieldsMap.set('reqInfo', {
      type: requestContext.getRequestInfoType(),
      creator: (req) => new TypescriptCodeExpression(`${req}.reqInfo`),
    });

    const contextFile = typescript.createTemplate({
      CONTEXT_FIELDS: { type: 'code-block' },
      CONTEXT_CREATOR: { type: 'code-expression' },
    });

    const [contextImport, contextPath] = makeImportAndFilePath(
      'src/utils/service-context.ts'
    );

    const importMap = {
      '%service-context': {
        path: contextImport,
        allowedImports: ['ServiceContext', 'createContextFromRequest'],
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

        contextFile.addCodeBlock(
          'CONTEXT_FIELDS',
          TypescriptCodeUtils.mergeBlocksAsInterfaceContent(
            R.mapObjIndexed((field) => field.type, contextFields)
          )
        );

        contextFile.addCodeExpression(
          'CONTEXT_CREATOR',
          TypescriptCodeUtils.mergeExpressionsAsObject(
            R.mapObjIndexed(
              (field) => field.creator('request', 'reply'),
              contextFields
            )
          )
        );

        await builder.apply(
          contextFile.renderToAction('service-context.ts', contextPath)
        );
      },
    };
  },
});

export default ServiceContextGenerator;
