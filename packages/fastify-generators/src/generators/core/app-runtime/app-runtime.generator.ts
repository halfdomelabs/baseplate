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
import {
  compareStrings,
  mapValuesOfMap,
  quot,
  toposort,
  ToposortCyclicalDependencyError,
} from '@baseplate-dev/utils';
import { z } from 'zod';

// Imported from the generated import-provider module rather than the package
// barrel: app-module-setup's generator imports from this file, so going
// through its barrel would create a module cycle.
import { appModuleSetupImportsProvider } from '../app-module-setup/generated/ts-import-providers.js';
import { appModuleImportsProvider } from '../app-module/app-module.generator.js';
import { CORE_APP_RUNTIME_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

/**
 * A slice's construction entry: the construction STATEMENTS for a single const
 * named after the entry's key, plus the other construction keys those
 * statements reference.
 *
 * `dependencies` is the hard ordering constraint - each named key is
 * constructed first, so the fragment can reference its const (e.g. `betterAuth`
 * references `emails`). Unknown or cyclic dependencies fail generation.
 *
 * `orderPriority` only breaks ties between slices left unordered by the
 * dependency graph, expressing disposal intent that no edge captures: disposal
 * runs in reverse construction order, so `FIRST` is for connection-level
 * resources (e.g. `redis`) that must be torn down only after everything
 * holding a connection has released it. Mirrors
 * `FastifyServerPlugin.orderPriority`.
 */
export interface AppRuntimeConstructionEntry {
  fragment: TsCodeFragment;
  dependencies?: string[];
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
 * Orders construction entries so each entry follows everything it declares in
 * `dependencies`. Entries the graph leaves unordered are emitted by
 * `orderPriority`, then key, keeping output stable across syncs.
 *
 * @param construction Construction entries keyed by the const each one builds.
 * @param providedNames Names bound before any construction runs (the
 * `flattenedModuleFields` destructure), so slices may depend on them.
 * @returns The entries in construction order.
 * @throws If a dependency is unregistered or the graph has a cycle.
 * @see toposort - the underlying sort; `compareFunc` breaks ties between
 * entries at the same topological level.
 */
export function sortConstructionEntries(
  construction: ReadonlyMap<string, AppRuntimeConstructionEntry>,
  providedNames: ReadonlySet<string>,
): [string, AppRuntimeConstructionEntry][] {
  // Checked here rather than left to toposort's ToposortUnknownNodeError so
  // the message can name the slice that declared the dependency.
  const edges = [...construction].flatMap(([key, entry]) =>
    (entry.dependencies ?? [])
      .filter((dependency) => !providedNames.has(dependency))
      .map((dependency): [string, string] => {
        if (!construction.has(dependency)) {
          throw new Error(
            `App runtime slice ${quot(key)} depends on ${quot(dependency)}, which no slice registers. Either enable the plugin that provides it or drop the dependency.`,
          );
        }
        return [dependency, key];
      }),
  );

  const compareReady = (a: string, b: string): number =>
    CONSTRUCTION_ORDER_PRIORITY_MAP[
      construction.get(a)?.orderPriority ?? 'MIDDLE'
    ] -
      CONSTRUCTION_ORDER_PRIORITY_MAP[
        construction.get(b)?.orderPriority ?? 'MIDDLE'
      ] || compareStrings(a, b);

  try {
    const sortedKeys = toposort([...construction.keys()], edges, {
      compareFunc: compareReady,
    });
    return sortedKeys.flatMap((key) => {
      const entry = construction.get(key);
      return entry
        ? [[key, entry] as [string, AppRuntimeConstructionEntry]]
        : [];
    });
  } catch (error) {
    if (error instanceof ToposortCyclicalDependencyError) {
      throw new TypeError(
        `App runtime slices have a circular construction dependency: ${error.cyclePath.join(' -> ')}.`,
        { cause: error },
      );
    }
    throw error;
  }
}

/**
 * A slice registers itself against these keyed maps, all keyed by the same
 * field name:
 * - `services`: the field's TYPE, rendered into `AppServices`.
 * - `construction`: the construction STATEMENTS for the field, topologically
 *   sorted so every entry named in a slice's `dependencies` is constructed
 *   before it (e.g. `betterAuth` declares `dependencies: ['emails']`).
 *   Slices the graph leaves unordered fall back to `orderPriority` (default
 *   `MIDDLE`), then key order. Should push a disposer via
 *   `disposers.push(...)` if the slice owns a resource that needs cleanup.
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

            // The destructure below binds these before any slice runs, so a
            // slice may name one as a dependency without a construction entry
            // providing it.
            const orderedConstruction = sortConstructionEntries(
              construction,
              new Set(flattenedModuleFields.values()),
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
