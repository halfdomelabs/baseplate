import type { FastifyPluginAsync, FastifyPluginCallback } from 'fastify';

import type { AnyNotificationType } from '../modules/notifications/registry.js';
import type { QueueHandlerBinding } from '../types/queue.types.js';
import type { AppServices } from './runtime-services.js';

/**
 * A Fastify plugin registered through `AppModule.plugins`, receiving the
 * services as its options. Plugins that don't need any can ignore the option;
 * plugins that do should narrow it to what they use - declare
 * `{ services: Pick<AppServices, 'stripe'> }` rather than accepting
 * every service. Disposal is not reachable from here: the runtime that owns
 * the graph disposes it.
 */
export type AppPlugin =
  | FastifyPluginCallback<{ services: AppServices }>
  | FastifyPluginAsync<{ services: AppServices }>;

/**
 * A raw, unflattened module declaration. Feature modules declare this via
 * {@link defineAppModule} - only the root calls {@link flattenAppModule}.
 */
export interface AppModule {
  children?: AppModule[];
  /* TPL_MODULE_FIELDS:START */
  notificationTypes?: AnyNotificationType[];
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
    notificationTypes: [...(rootModule.notificationTypes ?? [])],
    plugins: [...(rootModule.plugins ?? [])],
    queues: [...(rootModule.queues ?? [])],
  }; /* TPL_MODULE_INITIALIZER:END */

  for (const child of flattenedChildren) {
    /* TPL_MODULE_MERGER:START */
    result.notificationTypes.push(...(child.notificationTypes ?? []));
    result.plugins.push(...(child.plugins ?? []));
    result.queues.push(...(child.queues ?? []));
    /* TPL_MODULE_MERGER:END */
  }

  return result;
}
