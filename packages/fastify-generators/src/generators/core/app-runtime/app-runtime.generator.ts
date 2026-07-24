import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  packageScope,
  tsCodeFragment,
  TsCodeUtils,
} from '@baseplate-dev/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@baseplate-dev/sync';
import { mapValuesOfMap, quot } from '@baseplate-dev/utils';
import { sortBy } from 'es-toolkit';
import { z } from 'zod';

import { CORE_APP_RUNTIME_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

/**
 * A slice's construction entry: the construction STATEMENTS plus an optional
 * priority controlling render order relative to other slices, since a later
 * slice may reference an earlier slice's already-constructed const (e.g.
 * `betterAuth` needs `queues`). Mirrors `FastifyServerPlugin.orderPriority`.
 */
export interface AppRuntimeConstructionEntry {
  fragment: TsCodeFragment;
  orderPriority?: 'EARLY' | 'MIDDLE' | 'END';
}

const CONSTRUCTION_ORDER_PRIORITY_MAP = { EARLY: 0, MIDDLE: 1, END: 2 };

/**
 * A slice registers itself against these keyed maps, all keyed by the same
 * field name:
 * - `services`: the field's TYPE, rendered into `RuntimeServices`.
 * - `construction`: the construction STATEMENTS for the field, rendered in
 *   `orderPriority` order (default `MIDDLE`, tie-broken by key) so a later
 *   slice can depend on an earlier one's already-constructed const (e.g.
 *   `betterAuth` needs `queues`, so `queues` registers `EARLY`). Should push
 *   a disposer via `disposers.push(...)` if the slice owns a resource that
 *   needs cleanup.
 * - `runtimeFields` (optional): the field's TYPE for `AppRuntime`'s top-level
 *   surface, for slices that need a view beyond `services` (e.g.
 *   `runtime.queues` exposes the full `QueueRuntime`, not just the narrowed
 *   `QueueService` on `services.queues`). The alias invariant
 *   (`runtime.services.queues === runtime.queues`) is satisfied structurally
 *   by construction returning one object referenced from both places - this
 *   map only controls the additional top-level TYPE declaration.
 * - `constructionOptions` (optional): a field on `createAppRuntime`'s single
 *   options parameter, for slices whose construction needs a caller-supplied
 *   value (e.g. pg-boss's `disableQueueMaintenance`, with no bullmq
 *   equivalent). Referenced from a construction statement as `options.<key>`.
 */
const [setupTask, appRuntimeConfigProvider, appRuntimeConfigValuesProvider] =
  createConfigProviderTask(
    (t) => ({
      services: t.map<string, TsCodeFragment>(),
      construction: t.map<string, AppRuntimeConstructionEntry>(),
      runtimeFields: t.map<string, TsCodeFragment>(),
      constructionOptions: t.map<string, TsCodeFragment>(),
    }),
    {
      prefix: 'app-runtime',
      configScope: packageScope,
    },
  );

export { appRuntimeConfigProvider };

export interface AppRuntimeTestUtilsProvider {
  /**
   * A `RuntimeServices` object literal for tests that need a
   * `ServiceContext` but never touch runtime services directly - each field
   * throws on access instead of silently returning `undefined`.
   */
  getTestRuntimeServicesFragment(): TsCodeFragment;
}

export const appRuntimeTestUtilsProvider =
  createProviderType<AppRuntimeTestUtilsProvider>('app-runtime-test-utils');

/**
 * Generates the app runtime composition root: `createAppRuntime()` and the
 * `RuntimeServices` bag it delivers. Slices (queues, email, storage, etc.)
 * register themselves via `appRuntimeConfigProvider`; this generator renders
 * whatever they've registered.
 */
export const appRuntimeGenerator = createGenerator({
  name: 'core/app-runtime',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: CORE_APP_RUNTIME_GENERATED.paths.task,
    imports: CORE_APP_RUNTIME_GENERATED.imports.task,
    renderers: CORE_APP_RUNTIME_GENERATED.renderers.task,
    setup: setupTask,
    main: createGeneratorTask({
      dependencies: {
        renderers: CORE_APP_RUNTIME_GENERATED.renderers.provider,
        appRuntimeConfigValues: appRuntimeConfigValuesProvider,
      },
      exports: {
        appRuntimeTestUtils: appRuntimeTestUtilsProvider.export(packageScope),
      },
      run({
        renderers,
        appRuntimeConfigValues: {
          services,
          construction,
          runtimeFields,
          constructionOptions,
        },
      }) {
        return {
          providers: {
            appRuntimeTestUtils: {
              getTestRuntimeServicesFragment: () =>
                services.size === 0
                  ? tsCodeFragment('{}')
                  : TsCodeUtils.mergeFragmentsAsObject(
                      Object.fromEntries(
                        [...services.entries()].map(([key, type]) => [
                          key,
                          TsCodeUtils.template`new Proxy({}, { get() { throw new Error(${quot(`${key} is not available in this test context.`)}); } }) as ${type}`,
                        ]),
                      ),
                    ),
            },
          },
          build: async (builder) => {
            const servicesInterface =
              services.size === 0
                ? 'placeholder?: never'
                : TsCodeUtils.mergeFragmentsAsInterfaceContent(
                    mapValuesOfMap(services, (type) => type),
                  );

            const orderedConstruction = sortBy(
              [...construction.entries()],
              [
                ([, entry]) =>
                  CONSTRUCTION_ORDER_PRIORITY_MAP[
                    entry.orderPriority ?? 'MIDDLE'
                  ],
                ([key]) => key,
              ],
            );
            const constructionStatements = TsCodeUtils.mergeFragmentsPresorted(
              orderedConstruction.map(([, entry]) => entry.fragment),
              '\n\n',
            );

            const servicesObject =
              services.size === 0
                ? '{}'
                : TsCodeUtils.mergeFragmentsAsObject(
                    Object.fromEntries(
                      [...services.keys()].map((key) => [key, key]),
                    ),
                  );

            const runtimeFieldsInterface =
              runtimeFields.size === 0
                ? 'readonly __runtimeFieldsPlaceholder?: never'
                : TsCodeUtils.mergeFragmentsAsInterfaceContent(
                    mapValuesOfMap(runtimeFields, (type) => type),
                  );

            const runtimeFieldValues =
              runtimeFields.size === 0
                ? '{}'
                : TsCodeUtils.mergeFragmentsAsObject(
                    Object.fromEntries(
                      [...runtimeFields.keys()].map((key) => [key, key]),
                    ),
                  );

            const optionsParam =
              constructionOptions.size === 0
                ? ''
                : TsCodeUtils.template`
                  options: {
                    ${TsCodeUtils.mergeFragmentsAsInterfaceContent(
                      mapValuesOfMap(constructionOptions, (type) => type),
                    )}
                  } = {},`;

            await builder.apply(
              renderers.runtimeServices.render({
                variables: { TPL_SERVICES_FIELDS: servicesInterface },
              }),
            );
            await builder.apply(
              renderers.appRuntime.render({
                variables: {
                  TPL_RUNTIME_FIELDS: runtimeFieldsInterface,
                  TPL_OPTIONS_PARAM: optionsParam,
                  TPL_SERVICE_CONSTRUCTION: constructionStatements,
                  TPL_SERVICES_OBJECT: servicesObject,
                  TPL_RUNTIME_FIELD_VALUES: runtimeFieldValues,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
