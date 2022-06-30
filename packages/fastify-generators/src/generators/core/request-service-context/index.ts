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
import { requestContextProvider } from '../request-context';
import { serviceContextSetupProvider } from '../service-context';

const descriptorSchema = z.object({});

interface RequestContextField {
  name: string;
  type: TypescriptCodeExpression;
  creator: (req: string, reply: string) => TypescriptCodeExpression;
}

interface ServiceContextPassthrough {
  name: string;
  creator: (req: string, reply: string) => TypescriptCodeExpression;
}

export interface RequestServiceContextSetupProvider extends ImportMapper {
  addContextField(field: RequestContextField): void;
  addContextPassthrough(passthrough: ServiceContextPassthrough): void;
  getContextPath(): string;
}

export const requestServiceContextSetupProvider =
  createProviderType<RequestServiceContextSetupProvider>(
    'request-service-context-setup'
  );

export interface RequestServiceContextProvider extends ImportMapper {
  getContextPath(): string;
}

export const requestServiceContextProvider =
  createProviderType<RequestServiceContextProvider>('request-service-context');

const RequestServiceContextGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    typescript: typescriptProvider,
    requestContext: requestContextProvider,
    serviceContextSetup: serviceContextSetupProvider,
  },
  exports: {
    requestServiceContextSetup: requestServiceContextSetupProvider,
    requestServiceContext: requestServiceContextProvider
      .export()
      .dependsOn(requestServiceContextSetupProvider),
  },
  createGenerator(
    descriptor,
    { typescript, requestContext, serviceContextSetup }
  ) {
    const contextPassthroughMap = createNonOverwriteableMap<
      Record<string, ServiceContextPassthrough>
    >({}, { name: 'service-context-passthrough' });

    const contextFieldsMap = createNonOverwriteableMap<
      Record<string, RequestContextField>
    >({}, { name: 'request-service-context-fields' });

    contextFieldsMap.set('reqInfo', {
      name: 'reqInfo',
      type: requestContext.getRequestInfoType(),
      creator: (req) => new TypescriptCodeExpression(`${req}.reqInfo`),
    });

    const [contextImport, contextPath] = makeImportAndFilePath(
      'src/utils/request-service-context.ts'
    );

    const importMap = {
      '%request-service-context': {
        path: contextImport,
        allowedImports: ['RequestServiceContext', 'createContextFromRequest'],
      },
    };

    return {
      getProviders: () => ({
        requestServiceContextSetup: {
          addContextField: (field) => {
            contextFieldsMap.set(field.name, field);
          },
          addContextPassthrough: (passthrough) => {
            contextPassthroughMap.set(passthrough.name, passthrough);
          },
          getImportMap: () => importMap,
          getContextPath: () => contextPath,
        },
        requestServiceContext: {
          getImportMap: () => importMap,
          getContextPath: () => contextPath,
        },
      }),
      build: async (builder) => {
        const contextFields = contextFieldsMap.value();
        const contextPassthroughs = contextPassthroughMap.value();
        const contextFile = typescript.createTemplate(
          {
            CONTEXT_FIELDS: TypescriptCodeUtils.mergeBlocksAsInterfaceContent(
              R.mapObjIndexed((field) => field.type, contextFields)
            ),
            CONTEXT_CREATOR: TypescriptCodeUtils.mergeExpressions(
              [
                TypescriptCodeUtils.mergeExpressionsAsObject(
                  R.mapObjIndexed(
                    (field) => field.creator('request', 'reply'),
                    contextPassthroughs
                  )
                ).wrap((contents) => `...createServiceContext(${contents})`),
                ...Object.values(contextFields).map((field) =>
                  field
                    .creator('request', 'reply')
                    .wrap((contents) => `${field.name}: ${contents}`)
                ),
              ],
              ',\n'
            ).wrap((contents) => `{${contents}}`),
          },
          {
            importMappers: [serviceContextSetup],
          }
        );

        await builder.apply(
          contextFile.renderToAction('request-service-context.ts', contextPath)
        );
      },
    };
  },
});

export default RequestServiceContextGenerator;
