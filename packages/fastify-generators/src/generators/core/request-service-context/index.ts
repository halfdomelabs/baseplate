import type {
  ImportMapper,
  TypescriptCodeBlock,
} from '@halfdomelabs/core-generators';

import {
  makeImportAndFilePath,
  projectScope,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createNonOverwriteableMap,
  createProviderType,
  createReadOnlyProviderType,
} from '@halfdomelabs/sync';
import { mapValues } from 'es-toolkit';
import { z } from 'zod';

import { notEmpty } from '@src/utils/array.js';

import { requestContextProvider } from '../request-context/request-context.generator.js';
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
  createReadOnlyProviderType<RequestServiceContextProvider>(
    'request-service-context',
  );

export const requestServiceContextGenerator = createGenerator({
  name: 'core/request-service-context',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    setup: createGeneratorTask({
      dependencies: {
        typescript: typescriptProvider,
        requestContext: requestContextProvider,
        serviceContextSetup: serviceContextSetupProvider,
      },
      exports: {
        requestServiceContextSetup:
          requestServiceContextSetupProvider.export(projectScope),
      },
      outputs: {
        requestServiceContext:
          requestServiceContextProvider.export(projectScope),
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
          providers: {
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
          },
          build: async (builder) => {
            const contextFields = contextFieldsMap.value();
            const contextPassthroughs = contextPassthroughMap.value();
            const contextFile = typescript.createTemplate(
              {
                CONTEXT_FIELDS:
                  TypescriptCodeUtils.mergeBlocksAsInterfaceContent(
                    mapValues(contextFields, (field) => field.type),
                  ),
                CONTEXT_BODY: TypescriptCodeUtils.mergeBlocks(
                  Object.values(contextFields)
                    .map((f) => f.body?.('request', 'reply'))
                    .filter(notEmpty),
                ),
                CONTEXT_CREATOR: TypescriptCodeUtils.mergeExpressions(
                  [
                    (Object.keys(contextPassthroughs).length === 0
                      ? TypescriptCodeUtils.createExpression('')
                      : TypescriptCodeUtils.mergeExpressionsAsObject(
                          mapValues(contextPassthroughs, (field) =>
                            field.creator('request', 'reply'),
                          ),
                        )
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

            return {
              requestServiceContext: {
                getImportMap: () => importMap,
                getContextPath: () => contextPath,
              },
            };
          },
        };
      },
    }),
  }),
});
