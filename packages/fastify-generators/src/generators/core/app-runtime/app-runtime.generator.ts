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
import { compareStrings, mapValuesOfMap, quot } from '@baseplate-dev/utils';
import { sortBy } from 'es-toolkit';
import { z } from 'zod';

// Imported from the generated import-provider module rather than the package
// barrel: app-module-setup's generator imports from this file, so going
// through its barrel would create a module cycle.
import { appModuleSetupImportsProvider } from '../app-module-setup/generated/ts-import-providers.js';
import { appModuleImportsProvider } from '../app-module/app-module.generator.js';
import { CORE_APP_RUNTIME_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

/**
 * A slice's construction entry: the construction STATEMENTS plus an optional
 * priority controlling render order relative to other slices, since a later
 * slice may reference an earlier slice's already-constructed const (e.g.
 * `betterAuth` needs `emails`). Mirrors `FastifyServerPlugin.orderPriority`.
 *
 * `FIRST` is for connection-level resources other slices build on (e.g.
 * `redis`, which `pubsub` connects through). Constructing first also means
 * disposing last, after everything holding a connection has torn down.
 */
export interface AppRuntimeConstructionEntry {
  fragment: TsCodeFragment;
  orderPriority?: 'FIRST' | 'EARLY' | 'MIDDLE' | 'END';
}

/**
 * A top-level `AppRuntime` field: its type, plus an optional doc comment
 * rendered above the declaration.
 */
export interface AppRuntimeFieldEntry {
  type: TsCodeFragment;
  /** Doc comment for the field, e.g. `\/** ... *\/`. */
  comment?: string;
}

const CONSTRUCTION_ORDER_PRIORITY_MAP = {
  FIRST: 0,
  EARLY: 1,
  MIDDLE: 2,
  END: 3,
};

/**
 * A slice registers itself against these keyed maps, all keyed by the same
 * field name:
 * - `services`: the field's TYPE, rendered into `AppServices`.
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
 * - `flattenedModuleFields` (optional): an `AppModule` field this slice reads
 *   from the flattened root module, mapped to the local const name to bind it
 *   to (e.g. `queues` -> `queueBindings`). All entries are emitted as a single
 *   destructure of one `flattenAppModule(rootModule)` call, before any slice
 *   construction, so each field is flattened once regardless of how many
 *   slices consume it.
 */
const [setupTask, appRuntimeConfigProvider, appRuntimeConfigValuesProvider] =
  createConfigProviderTask(
    (t) => ({
      services: t.map<string, TsCodeFragment>(),
      construction: t.map<string, AppRuntimeConstructionEntry>(),
      runtimeFields: t.map<string, AppRuntimeFieldEntry>(),
      constructionOptions: t.map<string, TsCodeFragment>(),
      flattenedModuleFields: t.map<string, string>(),
    }),
    {
      prefix: 'app-runtime',
      configScope: packageScope,
    },
  );

export { appRuntimeConfigProvider };

export interface AppRuntimeTestUtilsProvider {
  /**
   * A `AppServices` object literal for tests that need a
   * `ServiceContext` but never touch runtime services directly - each field
   * throws on access instead of silently returning `undefined`.
   */
  getTestAppServicesFragment(): TsCodeFragment;
}

export const appRuntimeTestUtilsProvider =
  createProviderType<AppRuntimeTestUtilsProvider>('app-runtime-test-utils');

/**
 * Generates the app runtime composition root: `createAppRuntime()` and the
 * `AppServices` bag it delivers. Slices (queues, email, storage, etc.)
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
        appModuleImports: appModuleImportsProvider,
        appModuleSetupImports: appModuleSetupImportsProvider,
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
          flattenedModuleFields,
        },
        appModuleImports,
        appModuleSetupImports,
      }) {
        return {
          providers: {
            appRuntimeTestUtils: {
              getTestAppServicesFragment: () =>
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
            // One destructure of one flattenAppModule() call, before any
            // slice construction, so a field consumed by several slices is
            // still only flattened once.
            const flattenedModuleFragments =
              flattenedModuleFields.size === 0
                ? []
                : [
                    TsCodeUtils.template`const { ${[
                      ...flattenedModuleFields.entries(),
                    ]
                      .toSorted(([a], [b]) => compareStrings(a, b))
                      .map(([field, localName]) =>
                        field === localName
                          ? `${field} = []`
                          : `${field}: ${localName} = []`,
                      )
                      .join(
                        ', ',
                      )} } = ${appModuleSetupImports.flattenAppModule.fragment()}(${appModuleImports.getModuleFragment()});`,
                  ];

            const constructionStatements = TsCodeUtils.mergeFragmentsPresorted(
              [
                ...flattenedModuleFragments,
                ...orderedConstruction.map(([, entry]) => entry.fragment),
              ],
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

            // Built member-by-member rather than via
            // mergeFragmentsAsInterfaceContent so a field's `comment` renders
            // on its own line above the declaration.
            const runtimeFieldsInterface =
              runtimeFields.size === 0
                ? 'readonly __runtimeFieldsPlaceholder?: never'
                : TsCodeUtils.mergeFragmentsPresorted(
                    [...runtimeFields.entries()]
                      .toSorted(([a], [b]) => compareStrings(a, b))
                      .map(([key, entry]) =>
                        entry.comment
                          ? TsCodeUtils.template`${entry.comment}\n${key}: ${entry.type};`
                          : TsCodeUtils.template`${key}: ${entry.type};`,
                      ),
                    '\n',
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
