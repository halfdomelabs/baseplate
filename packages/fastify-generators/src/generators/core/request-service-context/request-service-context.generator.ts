import type { TsCodeFragment } from '@halfdomelabs/core-generators';

import {
  projectScope,
  TsCodeUtils,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
} from '@halfdomelabs/sync';
import { mapValuesOfMap } from '@halfdomelabs/utils';
import { z } from 'zod';

import { requestContextImportsProvider } from '../request-context/request-context.generator.js';
import { serviceContextImportsProvider } from '../service-context/service-context.generator.js';
import {
  createRequestServiceContextImports,
  requestServiceContextImportsProvider,
} from './generated/ts-import-maps.js';
import { CORE_REQUEST_SERVICE_CONTEXT_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({});

export interface RequestServiceContextField {
  type: TsCodeFragment;
  body?: (reqVarName: string, replyVarName: string) => TsCodeFragment;
  creator: (
    reqVarName: string,
    replyVarName: string,
  ) => TsCodeFragment | string;
}

export interface RequestServiceContextPassthrough {
  name: string;
  creator: (reqVarName: string, replyVarName: string) => TsCodeFragment;
}

const [
  setupTask,
  requestServiceContextConfigProvider,
  requestServiceContextConfigValuesProvider,
] = createConfigProviderTask(
  (t) => ({
    contextFields: t.map<string, RequestServiceContextField>(),
    contextPassthroughs: t.map<string, RequestServiceContextPassthrough>(),
  }),
  {
    prefix: 'request-service-context',
    configScope: projectScope,
  },
);

export { requestServiceContextConfigProvider };

export const requestServiceContextGenerator = createGenerator({
  name: 'core/request-service-context',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    setup: setupTask,
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        requestContextImports: requestContextImportsProvider,
        serviceContextImports: serviceContextImportsProvider,
        requestServiceContextSetupValues:
          requestServiceContextConfigValuesProvider,
      },
      exports: {
        requestServiceContextImports:
          requestServiceContextImportsProvider.export(projectScope),
      },
      run({
        typescriptFile,
        requestContextImports,
        serviceContextImports,
        requestServiceContextSetupValues: {
          contextFields,
          contextPassthroughs,
        },
      }) {
        contextFields.set('reqInfo', {
          type: requestContextImports.RequestInfo.typeFragment(),
          creator: (req) => `${req}.reqInfo`,
        });

        const requestServiceContextPath =
          '@/src/utils/request-service-context.ts';

        return {
          providers: {
            requestServiceContextImports:
              createRequestServiceContextImports('@/src/utils'),
          },
          build: async (builder) => {
            const contextCreator = TsCodeUtils.mergeFragmentsAsObject(
              {
                '...': TsCodeUtils.templateWithImports(
                  serviceContextImports.createServiceContext.declaration(),
                )`
              createServiceContext(${
                contextPassthroughs.size === 0
                  ? ''
                  : TsCodeUtils.mergeFragmentsAsObject(
                      mapValuesOfMap(contextPassthroughs, (field) =>
                        field.creator('request', 'reply'),
                      ),
                    )
              })`,
                ...Object.fromEntries(
                  mapValuesOfMap(contextFields, (field) =>
                    field.creator('request', 'reply'),
                  ),
                ),
              },
              {
                disableSort: true,
              },
            );

            await builder.apply(
              typescriptFile.renderTemplateFile({
                template:
                  CORE_REQUEST_SERVICE_CONTEXT_TS_TEMPLATES.requestServiceContext,
                destination: requestServiceContextPath,
                variables: {
                  TPL_CONTEXT_FIELDS:
                    TsCodeUtils.mergeFragmentsAsInterfaceContent(
                      mapValuesOfMap(contextFields, (field) => field.type),
                    ),
                  TPL_CONTEXT_BODY: TsCodeUtils.mergeFragments(
                    mapValuesOfMap(contextFields, (field) =>
                      field.body?.('request', 'reply'),
                    ),
                  ),
                  TPL_CONTEXT_CREATOR: contextCreator,
                },
                importMapProviders: {
                  serviceContextImports,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});

export { requestServiceContextImportsProvider } from './generated/ts-import-maps.js';
