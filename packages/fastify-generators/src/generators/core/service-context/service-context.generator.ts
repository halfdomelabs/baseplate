import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { packageScope, TsCodeUtils } from '@baseplate-dev/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
} from '@baseplate-dev/sync';
import { mapValuesOfMap } from '@baseplate-dev/utils';
import { sortBy } from 'es-toolkit';
import { z } from 'zod';

import { appRuntimeConfigValuesProvider } from '../app-runtime/app-runtime.generator.js';
import { appRuntimeImportsProvider } from '../app-runtime/generated/ts-import-providers.js';
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
  /**
   * The value of the argument for the system user, e.g. createSystemAuthContext().
   */
  systemValue?: TsCodeFragment;
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
    configScope: packageScope,
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
    renderers: CORE_SERVICE_CONTEXT_GENERATED.renderers.task,
    setup: setupTask,
    main: createGeneratorTask({
      dependencies: {
        serviceContextConfigValues: serviceContextConfigValuesProvider,
        appRuntimeConfigValues: appRuntimeConfigValuesProvider,
        renderers: CORE_SERVICE_CONTEXT_GENERATED.renderers.provider,
        appRuntimeImports: appRuntimeImportsProvider,
      },
      run({
        serviceContextConfigValues: { contextFields },
        appRuntimeConfigValues: { services },
        renderers,
        appRuntimeImports,
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

            const contextObject = TsCodeUtils.mergeFragmentsAsObject({
              ...Object.fromEntries(
                mapValuesOfMap(contextFields, (field) => field.setter),
              ),
              services: 'services',
            });

            const systemContextObject =
              orderedContextArgs.length === 0
                ? '{}'
                : TsCodeUtils.mergeFragmentsAsObject(
                    Object.fromEntries(
                      orderedContextArgs.map((arg) => [
                        arg.name,
                        arg.systemValue,
                      ]),
                    ),
                  );

            await builder.apply(
              renderers.serviceContext.render({
                variables: {
                  TPL_CONTEXT_INTERFACE: contextInterface,
                  TPL_CONTEXT_OBJECT: contextObject,
                  TPL_CREATE_CONTEXT_ARGS:
                    orderedContextArgs.length === 0
                      ? '_args: Record<string, never>'
                      : createContextArgs(false),
                  TPL_SYSTEM_CONTEXT_OBJECT: systemContextObject,
                },
              }),
            );

            const testObject =
              orderedContextArgs.length === 0
                ? '{}'
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

            // `services` is always present, unlike the context fields, so the
            // parameter is emitted even when no slice registered one - without
            // it there would be no seam to supply services in tests.
            const testArgs = TsCodeUtils.template`{
                ${[...orderedContextArgs.map((arg) => arg.name), 'services'].join(', ')} }: {
                 ${TsCodeUtils.mergeFragmentsPresorted(
                   [
                     ...orderedContextArgs.map(
                       (arg) =>
                         TsCodeUtils.template`${arg.name}${
                           arg.testDefault ? '?' : ''
                         }: ${arg.type}`,
                     ),
                     TsCodeUtils.template`services?: Partial<${appRuntimeImports.AppServices.typeFragment()}>`,
                   ],
                   '; ',
                 )}
                } = {}`;

            // The cast is only needed when `AppServices` has fields `Partial`
            // would otherwise widen - with none, `Partial<AppServices>` is
            // already `AppServices` and the cast is flagged as unnecessary.
            const suppliedServices =
              services.size === 0
                ? TsCodeUtils.template`services ?? {}`
                : TsCodeUtils.template`(services ?? {}) as ${appRuntimeImports.AppServices.typeFragment()}`;

            await builder.apply(
              renderers.testHelper.render({
                variables: {
                  TPL_CREATE_TEST_ARGS: testArgs,
                  TPL_CREATE_TEST_OBJECT: testObject,
                  TPL_SUPPLIED_SERVICES: suppliedServices,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
