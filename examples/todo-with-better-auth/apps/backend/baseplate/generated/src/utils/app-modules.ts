import type { FastifyPluginAsync, FastifyPluginCallback } from 'fastify';

import type { QueueHandlerBinding } from '../types/queue.types.js';
import type { RuntimeServices } from './runtime-services.js';

/**
 * The narrow view of `AppRuntime` module-contributed plugins receive as the
 * `runtime` option - services only, never lifecycle (`dispose`) or any
 * backend-specific control surface. `AppRuntime` structurally satisfies
 * this, so the server passes it directly; no adapter is needed.
 */
export interface PluginRuntime {
  readonly services: Readonly<RuntimeServices>;
}

/**
 * A {@link PluginRuntime} narrowed to only the named services, for plugins
 * that want an honest signature instead of accepting every service.
 */
export type PluginRuntimeWithServices<K extends keyof RuntimeServices> = Omit<
  PluginRuntime,
  'services'
> & { readonly services: Readonly<Pick<RuntimeServices, K>> };

/**
 * A Fastify plugin registered through `AppModule.plugins`, receiving the
 * {@link PluginRuntime} as its options. Plugins that don't need any services
 * can ignore the option; plugins that do should narrow it with
 * {@link PluginRuntimeWithServices} rather than accepting the full runtime.
 */
export type AppPlugin =
  | FastifyPluginCallback<{ runtime: PluginRuntime }>
  | FastifyPluginAsync<{ runtime: PluginRuntime }>;

/**
 * A raw, unflattened module declaration. Feature modules declare this via
 * {@link defineAppModule} - only the root calls {@link flattenAppModule}.
 */
export interface AppModule {
  children?: AppModule[];
  /* TPL_MODULE_FIELDS:START */
  plugins?: AppPlugin[];
  queues?: QueueHandlerBinding[];
  /* TPL_MODULE_FIELDS:END */
}

/**
 * Declares a feature module. Identity at runtime; exists so module authors
 * have one call site to reach for instead of a bare `satisfies AppModule`,
 * and so this file has a place to explain the convention: `children` is
 * wired automatically by the module tree and should not be set by hand.
 */
export function defineAppModule(module: AppModule): AppModule {
  return module;
}

/**
 * Flattens a raw module tree into a single set of contributions.
 *
 * Traversal is deterministic pre-order: a module's own contributions in
 * declared order, then its children in declared order, each recursively.
 * This fixes Fastify plugin registration order and similar ordering
 * guarantees for future contributed fields.
 */
export function flattenAppModule(
  module: AppModule,
): Omit<AppModule, 'children'> {
  const { children = [], ...rootModule } = module;

  const flattenedChildren = children.map(flattenAppModule);

  const result = /* TPL_MODULE_INITIALIZER:START */ {
    plugins: [...(rootModule.plugins ?? [])],
    queues: [...(rootModule.queues ?? [])],
  }; /* TPL_MODULE_INITIALIZER:END */

  for (const child of flattenedChildren) {
    /* TPL_MODULE_MERGER:START */
    result.plugins.push(...(child.plugins ?? []));
    result.queues.push(...(child.queues ?? []));
    /* TPL_MODULE_MERGER:END */
  }

  return result;
}
