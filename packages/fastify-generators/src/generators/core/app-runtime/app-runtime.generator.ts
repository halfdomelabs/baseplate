import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { packageScope, TsCodeUtils } from '@baseplate-dev/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
} from '@baseplate-dev/sync';
import {
  compareStrings,
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
 * A slice's construction entry: how to build the single runtime object named
 * by the entry's key, plus the other construction keys it references.
 *
 * `fragment` is an EXPRESSION producing the object (e.g.
 * `createRedisRuntime()`), not a statement block - the generator wraps it in a
 * `provide(...)` call so an override can skip construction entirely. Slices
 * that own a resource declare `disposeFragment` rather than pushing a disposer
 * themselves, so an overridden (borrowed) object is never disposed.
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
  /** Expression producing the object, e.g. `createRedisRuntime()`. */
  fragment: TsCodeFragment;
  /**
   * Expression releasing a CONSTRUCTED object, taking it as its only
   * parameter, e.g. `(redis) => redis.dispose()`. Omit if the slice owns no
   * resource. Never runs for an overridden object.
   */
  disposeFragment?: TsCodeFragment;
  dependencies?: string[];
  orderPriority?: 'FIRST' | 'EARLY' | 'MIDDLE' | 'END';
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
 * Verifies every name the runtime will reference is actually bound by
 * construction, and that no two bindings claim the same name.
 *
 * `sortConstructionEntries` covers the other direction (a slice depending on a
 * name nobody registers); without this, a slice that registers a `services`
 * entry but no matching `construction` entry emits a reference to an undefined
 * const, and generation succeeds while the generated project fails to
 * compile.
 *
 * @param maps The registered app-runtime config maps.
 * @throws If a declared field has no construction entry, or a construction key
 * collides with a flattened module binding.
 */
export function validateConstructionBindings({
  services,
  construction,
  flattenedModuleFields,
}: {
  services: ReadonlyMap<string, unknown>;
  construction: ReadonlyMap<string, AppRuntimeConstructionEntry>;
  flattenedModuleFields: ReadonlyMap<string, string>;
}): void {
  const constructedNames = new Set([
    ...construction.keys(),
    ...flattenedModuleFields.values(),
  ]);
  const unconstructed = [...services.keys()]
    .filter((key) => !constructedNames.has(key))
    .toSorted(compareStrings);
  if (unconstructed.length > 0) {
    throw new Error(
      `App runtime declares ${unconstructed.map((key) => quot(key)).join(', ')} but no slice registers a construction entry building them. Add a matching construction.set(...) or drop the declaration.`,
    );
  }

  // Construction consts and flattened module bindings share one identifier
  // namespace inside createAppRuntime, so a shared name emits a duplicate const.
  const collisions = [...flattenedModuleFields.values()]
    .filter((localName) => construction.has(localName))
    .toSorted(compareStrings);
  if (collisions.length > 0) {
    throw new Error(
      `App runtime construction ${collisions.map((key) => quot(key)).join(', ')} collides with a flattened module binding of the same name. Rename the binding's local name.`,
    );
  }
}

/**
 * Verifies every constructed object is declared on `services`, so all of them
 * can be supplied via `overrides` instead of constructed.
 *
 * @throws If a construction entry has no services type, which would leave it
 * silently constructing for real in tests.
 */
export function validateConstructionTypes({
  services,
  construction,
}: {
  services: ReadonlyMap<string, TsCodeFragment>;
  construction: ReadonlyMap<string, AppRuntimeConstructionEntry>;
}): void {
  const untyped = [...construction.keys()]
    .filter((key) => !services.has(key))
    .toSorted(compareStrings);
  if (untyped.length > 0) {
    throw new Error(
      `App runtime slice ${untyped.map((key) => quot(key)).join(', ')} registers a construction entry but no services type, so it cannot be overridden in tests and would silently construct for real. Register its type with services.set(...).`,
    );
  }
}

/**
 * A slice registers itself against these keyed maps, all keyed by the same
 * field name:
 * - `services`: the field's TYPE, rendered into `AppServices`. Every
 *   application-scoped dependency belongs here, including lifecycle-bearing
 *   ones like `queues` and `redis` - `AppRuntime` owns the graph and its
 *   disposal rather than acting as a second registry, and consumers narrow
 *   with `ServiceContextWith<K>` to declare what they actually use.
 * - `construction`: how to build the field, topologically sorted so every
 *   entry named in a slice's `dependencies` is constructed before it (e.g.
 *   `betterAuth` declares `dependencies: ['emails']`). Slices the graph leaves
 *   unordered fall back to `orderPriority` (default `MIDDLE`), then key order.
 *   Each entry is emitted as a `provide('<key>', ...)` call, so supplying the
 *   key via `createAppRuntime({ overrides })` skips its construction; declare
 *   `disposeFragment` for cleanup rather than pushing a disposer directly.
 * - `flattenedModuleFields` (optional): an `AppModule` field this slice reads
 *   from the flattened root module, mapped to the local const name to bind it
 *   to (e.g. `queues` -> `queueBindings`). All entries are emitted as a single
 *   destructure of one `flattenAppModule(rootModule)` call, before any slice
 *   construction, so each field is flattened once regardless of how many
 *   slices consume it.
 * - `usesBackgroundServices` (optional): declares that a slice starts loops at
 *   CONSTRUCTION time that should run in only one process, which adds the
 *   `backgroundServices` option to `createAppRuntime`. Set it only from a slice
 *   that reads `options.backgroundServices`, so a project whose slices have no
 *   such loops never generates an option nothing consumes. pg-boss sets it
 *   because `supervise`/`schedule` are client constructor options and any
 *   enqueue starts them; bullmq does not, because its repeatable-job
 *   registration happens inside `startWorkers()` and is already gated by
 *   whether a process starts workers at all.
 *
 * Slices contribute no other top-level options: `createAppRuntime`'s surface is
 * application-wide runtime policy, not a bag of per-service switches. Anything
 * narrower than a process-level capability belongs inside the service factory.
 */
const [setupTask, appRuntimeConfigProvider, appRuntimeConfigValuesProvider] =
  createConfigProviderTask(
    (t) => ({
      services: t.map<string, TsCodeFragment>(),
      construction: t.map<string, AppRuntimeConstructionEntry>(),
      flattenedModuleFields: t.map<string, string>(),
      usesBackgroundServices: t.scalar<boolean>(),
    }),
    {
      prefix: 'app-runtime',
      configScope: packageScope,
    },
  );

export { appRuntimeConfigProvider };

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
      run({
        renderers,
        appRuntimeConfigValues: {
          services,
          construction,
          flattenedModuleFields,
          usesBackgroundServices,
        },
        appModuleImports,
        appModuleSetupImports,
      }) {
        return {
          build: async (builder) => {
            validateConstructionBindings({
              services,
              construction,
              flattenedModuleFields,
            });
            validateConstructionTypes({ services, construction });

            // `readonly` is declared on the fields rather than wrapped in
            // `Readonly<>` at each use site, so `Pick<AppServices, K>` carries
            // it through - a modifier survives Pick, a wrapper would have to be
            // reapplied everywhere.
            const servicesInterface =
              services.size === 0
                ? 'placeholder?: never'
                : TsCodeUtils.mergeFragmentsPresorted(
                    [...services.entries()]
                      .toSorted(([a], [b]) => compareStrings(a, b))
                      .map(
                        ([key, type]) =>
                          TsCodeUtils.template`readonly ${key}: ${type};`,
                      ),
                    '\n',
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

            // Each object is built through `provide`, so an override skips its
            // construction and is never disposed. The disposer is an argument
            // rather than a statement inside the fragment, which is what keeps
            // borrowed overrides from registering one.
            const constructionStatements = TsCodeUtils.mergeFragmentsPresorted(
              [
                ...flattenedModuleFragments,
                ...orderedConstruction.map(([key, entry]) =>
                  entry.disposeFragment
                    ? TsCodeUtils.template`const ${key} = provide(${quot(key)}, () => ${entry.fragment}, ${entry.disposeFragment});`
                    : TsCodeUtils.template`const ${key} = provide(${quot(key)}, () => ${entry.fragment});`,
                ),
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

            // Application-wide runtime policy only - slices opt into these
            // rather than contributing options of their own, so the parameter
            // can't accrue per-service switches. Defaulted, so
            // `createAppRuntime()` keeps working with no arguments.
            const backgroundServicesOption = usesBackgroundServices
              ? TsCodeUtils.template`
                /**
                 * Whether this process runs the background loops a service owns, e.g.
                 * pg-boss supervision and scheduling. Exactly one process should enable
                 * them.
                 *
                 * Defaults to \`false\`, so scripts and tests stay passive unless they opt
                 * in.
                 */
                backgroundServices?: boolean;`
              : undefined;

            const optionsParam = TsCodeUtils.template`
              options: {
                ${TsCodeUtils.mergeFragmentsPresorted(
                  [
                    ...(backgroundServicesOption
                      ? [backgroundServicesOption]
                      : []),
                    TsCodeUtils.template`
                /**
                 * Services to use instead of constructing them. An overridden key's
                 * construction is skipped entirely and downstream construction consumes the
                 * override. Overrides are borrowed: the runtime never disposes them.
                 */
                overrides?: Partial<AppServices>;`,
                  ],
                  '\n',
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
                  TPL_OPTIONS_PARAM: optionsParam,
                  TPL_SERVICE_CONSTRUCTION: constructionStatements,
                  TPL_SERVICES_OBJECT: servicesObject,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
