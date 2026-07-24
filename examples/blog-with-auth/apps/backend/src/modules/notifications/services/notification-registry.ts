import type { z } from 'zod';

import type { NotificationChannelKey } from './notification-channel.js';
import type {
  NotificationContent,
  NotificationParams,
  RenderContext,
} from './notification-content.js';

/**
 * A single event feeding a render. Array-shaped so the future digest engine can
 * pass N ("and N others") additively; today `render` always gets one.
 */
export interface NotificationEvent<
  P extends NotificationParams = NotificationParams,
> {
  recipientId: string;
  params: P;
  actorId?: string;
  entityType?: string;
  entityId?: string;
}

/**
 * A code-defined notification type, pinned to a `version`.
 *
 * Because the feed renders at READ time, rows are resolved by `(key, version)`
 * — not "whatever renderer is deployed now". Bump `version` for a structural
 * copy or param change and register the old definition alongside it: existing
 * rows keep rendering with the renderer that produced them, while translation
 * and wording fixes *within* a version still apply retroactively.
 *
 * `render` MUST be pure and synchronous (it runs per row per request).
 */
export interface NotificationTypeDefinition<
  P extends NotificationParams = NotificationParams,
> {
  /** Stable key stored on the row, e.g. "post.commented". */
  key: string;
  /** Renderer version stored on the row. Bump on breaking copy/param changes. */
  version: number;
  /** Validates stored params before render; failure falls back to the snapshot. */
  paramsSchema: z.ZodType<P>;
  /** Eligible delivery channels, checked against the static channel dictionary. */
  channels: readonly NotificationChannelKey[];
  /** Render content from a batch of events, in `ctx.locale`. */
  render: (
    events: NotificationEvent<P>[],
    ctx: RenderContext,
  ) => NotificationContent;
}

/** Registry key: a row's renderer is pinned by BOTH its type and its version. */
function registryKey(key: string, version: number): string {
  return `${key}@${version}`;
}

const registry = new Map<string, NotificationTypeDefinition>();

/** Register a notification type version (call at module load). */
export function defineNotificationType<P extends NotificationParams>(
  definition: NotificationTypeDefinition<P>,
): NotificationTypeDefinition<P> {
  const id = registryKey(definition.key, definition.version);
  if (registry.has(id)) {
    throw new Error(`Notification type "${id}" is already defined`);
  }
  registry.set(id, definition as unknown as NotificationTypeDefinition);
  return definition;
}

/** Look up the renderer that a row was created with. */
export function getNotificationType(
  key: string,
  version: number,
): NotificationTypeDefinition | undefined {
  return registry.get(registryKey(key, version));
}
