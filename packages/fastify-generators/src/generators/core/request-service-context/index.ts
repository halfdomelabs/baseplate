import {
  ImportMapper,
  makeImportAndFilePath,
  TypescriptCodeBlock,
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
import { notEmpty } from '@src/utils/array.js';
import { requestContextProvider } from '../request-context/index.js';
import { serviceContextSetupProvider } from '../service-context/index.js';

const descriptorSchema = z.object({});

interface RequestContextField {
  name: string;
  type: TypescriptCodeExpression;
  body?: (req: string, reply: string) => TypescriptCodeBlock;
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
    'request-service-context-setup',
  );

export interface RequestServiceContextProvider extends ImportMapper {
  getContextPath(): string;
}

export const requestServiceContextProvider =
  createProviderType<RequestServiceContextProvider>('request-service-context', {
    isReadOnly: true,
  });

const RequestServiceContextGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder) {
    const setupTask = taskBuilder.addTask({
      name: 'setup',
      dependencies: {
        typescript: typescriptProvider,
        requestContext: requestContextProvider,
        serviceContextSetup: serviceContextSetupProvider,
      },
      exports: {
        requestServiceContextSetup: requestServiceContextSetupProvider,
      },
      run({ typescript, requestContext, serviceContextSetup }) {
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
          'src/utils/request-service-context.ts',
        );

        const importMap = {
          '%request-service-context': {
            path: contextImport,
            allowedImports: [
              'RequestServiceContext',
              'createContextFromRequest',
            ],
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
          }),
          build: async (builder) => {
            const contextFields = contextFieldsMap.value();
            const contextPassthroughs = contextPassthroughMap.value();
            const contextFile = typescript.createTemplate(
              {
                CONTEXT_FIELDS:
                  TypescriptCodeUtils.mergeBlocksAsInterfaceContent(
                    R.mapObjIndexed((field) => field.type, contextFields),
                  ),
                CONTEXT_BODY: TypescriptCodeUtils.mergeBlocks(
                  Object.values(contextFields)
                    .map((f) => f.body?.('request', 'reply'))
                    .filter(notEmpty),
                ),
                CONTEXT_CREATOR: TypescriptCodeUtils.mergeExpressions(
                  [
                    TypescriptCodeUtils.mergeExpressionsAsObject(
                      R.mapObjIndexed(
                        (field) => field.creator('request', 'reply'),
                        contextPassthroughs,
                      ),
                    ).wrap(
                      (contents) => `...createServiceContext(${contents})`,
                    ),
                    ...Object.values(contextFields).map((field) =>
                      field
                        .creator('request', 'reply')
                        .wrap((contents) => `${field.name}: ${contents}`),
                    ),
                  ],
                  ',\n',
                ).wrap((contents) => `{${contents}}`),
              },
              {
                importMappers: [serviceContextSetup],
              },
            );

            await builder.apply(
              contextFile.renderToAction(
                'request-service-context.ts',
                contextPath,
              ),
            );

            return { importMap, contextPath };
          },
        };
      },
    });

    taskBuilder.addTask({
      name: 'output',
      exports: {
        requestServiceContext: requestServiceContextProvider,
      },
      taskDependencies: { setupTask },
      run(deps, { setupTask: { importMap, contextPath } }) {
        return {
          getProviders: () => ({
            requestServiceContext: {
              getImportMap: () => importMap,
              getContextPath: () => contextPath,
            },
          }),
          build: async () => {
            // do nothing
          },
        };
      },
    });
  },
});

export default RequestServiceContextGenerator;
