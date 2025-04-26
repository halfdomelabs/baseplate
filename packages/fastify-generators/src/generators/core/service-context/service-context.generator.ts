import type {
  ImportMapper,
  TsCodeFragment,
  TypescriptCodeExpression,
} from '@halfdomelabs/core-generators';

import {
  projectScope,
  TsCodeUtils,
  TypescriptCodeUtils,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@halfdomelabs/sync';
import { mapValuesOfMap } from '@halfdomelabs/utils';
import { sortBy } from 'es-toolkit';
import { z } from 'zod';

import {
  createServiceContextImports,
  serviceContextImportsProvider,
} from './generated/ts-import-maps.js';
import { CORE_SERVICE_CONTEXT_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({});

interface ServiceContextFieldCreatorArgument {
  /**
   * The name of the argument, e.g. authContext.
   */
  name: string;
  /**
   * The type of the argument, e.g. AuthContext.
   */
  type: TsCodeFragment;
  /**
   * The default value of the argument, e.g. createAuthContextFromSessionInfo(undefined).
   */
  testDefault?: TsCodeFragment;
}

export interface ServiceContextField {
  /**
   * The Typescript type of the field, e.g. AuthContext.
   */
  type: TsCodeFragment;
  /**
   * The setter for the field, e.g. authContext based off the arguments.
   */
  setter: TsCodeFragment | string;
  /**
   * The arguments to pass to the creator function, e.g. { authContext }.
   */
  creatorArguments?: ServiceContextFieldCreatorArgument[];
}

const [
  setupTask,
  serviceContextConfigProvider,
  serviceContextConfigValuesProvider,
] = createConfigProviderTask(
  (t) => ({
    contextFields: t.map<string, ServiceContextField>(),
  }),
  {
    prefix: 'service-context-config',
    configScope: projectScope,
  },
);

export { serviceContextConfigProvider };

export interface ServiceContextProvider extends ImportMapper {
  getServiceContextType(): TypescriptCodeExpression;
}

export const serviceContextProvider =
  createReadOnlyProviderType<ServiceContextProvider>('service-context');

export const serviceContextGenerator = createGenerator({
  name: 'core/service-context',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    setup: setupTask,
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        serviceContextConfigValues: serviceContextConfigValuesProvider,
      },
      exports: {
        serviceContextImports:
          serviceContextImportsProvider.export(projectScope),
        serviceContext: serviceContextProvider.export(projectScope),
      },
      run({ typescriptFile, serviceContextConfigValues: { contextFields } }) {
        const serviceContextPath = '@/src/utils/service-context.ts';
        const testHelperPath =
          '@/src/tests/helpers/service-context.test-helper.ts';

        const importMap = {
          '%service-context': {
            path: serviceContextPath,
            allowedImports: ['ServiceContext', 'createServiceContext'],
          },
          '%service-context/test': {
            path: testHelperPath,
            allowedImports: ['createTestServiceContext'],
          },
        };

        return {
          providers: {
            serviceContextImports: createServiceContextImports('@/src'),
            serviceContext: {
              getImportMap: () => importMap,
              getServiceContextType: () =>
                TypescriptCodeUtils.createExpression(
                  'ServiceContext',
                  `import {ServiceContext} from '${serviceContextPath}'`,
                ),
            },
          },
          build: async (builder) => {
            const orderedContextArgs = sortBy(
              [...contextFields.entries()],
              [([key]) => key],
            ).flatMap(([, field]) => field.creatorArguments ?? []);

            const contextInterface =
              contextFields.size === 0
                ? 'placeholder?: never'
                : TsCodeUtils.mergeFragmentsAsInterfaceContent(
                    mapValuesOfMap(contextFields, (field) => field.type),
                  );

            function createContextArgs(
              testMode?: boolean,
            ): TsCodeFragment | string {
              if (orderedContextArgs.length === 0) {
                return '';
              }

              return TsCodeUtils.template`
                {
              ${orderedContextArgs.map((arg) => arg.name).join(', ')} }: {
                 ${TsCodeUtils.mergeFragmentsPresorted(
                   orderedContextArgs.map(
                     (arg) =>
                       TsCodeUtils.template`${arg.name}${
                         testMode && arg.testDefault ? '?' : ''
                       }: ${arg.type}`,
                   ),
                   '; ',
                 )}
                }`;
            }

            const contextObject = TsCodeUtils.mergeFragmentsAsObject(
              mapValuesOfMap(contextFields, (field) => field.setter),
            );

            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: CORE_SERVICE_CONTEXT_TS_TEMPLATES.serviceContext,
                destination: serviceContextPath,
                variables: {
                  TPL_CONTEXT_INTERFACE: contextInterface,
                  TPL_CONTEXT_OBJECT: contextObject,
                  TPL_CREATE_CONTEXT_ARGS: createContextArgs(false),
                },
              }),
            );

            const testObject =
              orderedContextArgs.length === 0
                ? ''
                : TsCodeUtils.mergeFragmentsAsObject(
                    Object.fromEntries(
                      orderedContextArgs.map((arg) => [
                        arg.name,
                        arg.testDefault
                          ? TsCodeUtils.template`${arg.name} ?? ${arg.testDefault}`
                          : arg.name,
                      ]),
                    ),
                  );

            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: CORE_SERVICE_CONTEXT_TS_TEMPLATES.testHelper,
                destination: testHelperPath,
                variables: {
                  TPL_CREATE_TEST_ARGS:
                    orderedContextArgs.length === 0
                      ? ''
                      : TsCodeUtils.template`${createContextArgs(true)} = {}`,
                  TPL_CREATE_TEST_OBJECT: testObject,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});

export {
  serviceContextImportsProvider,
  ServiceContextImportsProvider,
} from './generated/ts-import-maps.js';
