import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  projectScope,
  TsCodeUtils,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
} from '@baseplate-dev/sync';
import { mapValuesOfMap } from '@baseplate-dev/utils';
import { sortBy } from 'es-toolkit';
import { z } from 'zod';

import { CORE_SERVICE_CONTEXT_GENERATED } from './generated/index.js';

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

export const serviceContextGenerator = createGenerator({
  name: 'core/service-context',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: CORE_SERVICE_CONTEXT_GENERATED.paths.task,
    imports: CORE_SERVICE_CONTEXT_GENERATED.imports.task,
    setup: setupTask,
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        serviceContextConfigValues: serviceContextConfigValuesProvider,
        paths: CORE_SERVICE_CONTEXT_GENERATED.paths.provider,
      },
      run({
        typescriptFile,
        serviceContextConfigValues: { contextFields },
        paths,
      }) {
        return {
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
                template:
                  CORE_SERVICE_CONTEXT_GENERATED.templates.serviceContext,
                destination: paths.serviceContext,
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
                template: CORE_SERVICE_CONTEXT_GENERATED.templates.testHelper,
                destination: paths.testHelper,
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
