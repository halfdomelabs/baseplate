import type { NotificationAction } from './notification-content.js';

import { isSafeUrl } from './notification-content.js';

/** Builds the current URL for an entity type. Registered by the application. */
export type EntityRouteResolver = (id: string) => string;

const routes = new Map<string, EntityRouteResolver>();

/**
 * Register the route for an entity type (call at module load). Because entity
 * actions are routed at READ time, changing a route here updates every existing
 * notification pointing at that entity type — no stale URLs.
 */
export function registerEntityRoute(
  entityType: string,
  resolve: EntityRouteResolver,
): void {
  if (routes.has(entityType)) {
    throw new Error(`Entity route "${entityType}" is already registered`);
  }
  routes.set(entityType, resolve);
}

/**
 * Resolve an action to a URL. Entity actions route through the registry (live);
 * `url` actions are used as-is (for targets that can't be re-derived). Returns
 * null for an unroutable entity type or an unsafe URL.
 */
export function resolveActionUrl(
  action: NotificationAction | undefined,
): string | null {
  if (!action) return null;
  if (action.kind === 'url') {
    return isSafeUrl(action.url) ? action.url : null;
  }
  const resolve = routes.get(action.type);
  if (!resolve) return null;
  const url = resolve(action.id);
  return isSafeUrl(url) ? url : null;
}
