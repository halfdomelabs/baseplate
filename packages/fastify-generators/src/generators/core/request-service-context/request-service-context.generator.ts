import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  packageScope,
  TsCodeUtils,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
} from '@baseplate-dev/sync';
import { mapValuesOfMap } from '@baseplate-dev/utils';
import { z } from 'zod';

import { requestContextImportsProvider } from '../request-context/index.js';
import { serviceContextImportsProvider } from '../service-context/index.js';
import { CORE_REQUEST_SERVICE_CONTEXT_GENERATED } from './generated/index.js';

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
    configScope: packageScope,
  },
);

export { requestServiceContextConfigProvider };

export const requestServiceContextGenerator = createGenerator({
  name: 'core/request-service-context',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: CORE_REQUEST_SERVICE_CONTEXT_GENERATED.paths.task,
    imports: CORE_REQUEST_SERVICE_CONTEXT_GENERATED.imports.task,
    setup: setupTask,
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        requestContextImports: requestContextImportsProvider,
        serviceContextImports: serviceContextImportsProvider,
        requestServiceContextSetupValues:
          requestServiceContextConfigValuesProvider,
        paths: CORE_REQUEST_SERVICE_CONTEXT_GENERATED.paths.provider,
      },
      run({
        typescriptFile,
        requestContextImports,
        serviceContextImports,
        requestServiceContextSetupValues: {
          contextFields,
          contextPassthroughs,
        },
        paths,
      }) {
        contextFields.set('reqInfo', {
          type: requestContextImports.RequestInfo.typeFragment(),
          creator: (req) => `${req}.reqInfo`,
        });

        return {
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
                  CORE_REQUEST_SERVICE_CONTEXT_GENERATED.templates
                    .requestServiceContext,
                destination: paths.requestServiceContext,
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
