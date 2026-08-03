import type { z } from 'zod';

import type { NotificationCategoryKey } from '../constants/notification-categories.js';
import type { NotificationRoutingTarget } from './notification-channel.js';
import type {
  NotificationContent,
  NotificationParams,
  RenderContext,
} from './notification-content.js';

/**
 * Who triggered a notification, as display identity.
 *
 * An INPUT to rendering: the renderer decides copy from "who did this" rather
 * than inventing it, and holds no I/O of its own. The label is the caller's
 * `actorLabel` snapshot, or the system actor key when there is no user row.
 * Only the delivery path resolves live identity, which it passes in explicitly.
 */
export interface NotificationActor {
  label: string;
  avatarUrl?: string;
}

/** A single event feeding a render. */
export interface NotificationEvent<
  P extends NotificationParams = NotificationParams,
> {
  params: P;
  actor?: NotificationActor;
  entityType?: string;
  entityId?: string;
}

/** Fields shared by both renderer shapes. */
interface NotificationTypeBase<P extends NotificationParams> {
  /** Stable key stored on the row, e.g. "post.commented". */
  key: string;
  /** Renderer version stored on the row. Bump on breaking copy/param changes. */
  version: number;
  /**
   * Coarse bucket for filtering and preference grouping, e.g. "billing".
   *
   * Declared on the type, not stored per row: it is a static property of
   * `post.commented`, so a per-row copy would drift. Read time derives it from
   * the registry.
   *
   * Narrowed to the declared categories so removing one from the project
   * definition breaks the build here rather than orphaning preference rows.
   */
  category: NotificationCategoryKey;
  /** Validates stored params before render; failure falls back to the snapshot. */
  paramsSchema: z.ZodType<P>;
  /** Routing targets for this type. */
  channels: readonly NotificationRoutingTarget[];
}

/** The default shape: one event in, one render out. */
export interface SingleNotificationType<
  P extends NotificationParams = NotificationParams,
> extends NotificationTypeBase<P> {
  aggregate?: undefined;
  render(event: NotificationEvent<P>, ctx: RenderContext): NotificationContent;
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
 *
 * There is no aggregatable variant. Collapsing is a property of the CALL, not
 * the type: passing a `key` to `notify` opts that notification into
 * replace-in-place, the outbound debounce, and retractability. The same type
 * can therefore be used both ways — one row per like-thread, one row per
 * @mention — without declaring anything up front.
 *
 * Write copy **state-phrased** ("Alice, Bob and 3 others liked your post")
 * rather than delta-phrased ("3 new likes"): a keyed row holds current state,
 * and `render` sees only that state, never what changed since last time.
 */
export interface NotificationTypeDefinition<
  P extends NotificationParams = NotificationParams,
> extends NotificationTypeBase<P> {
  render(event: NotificationEvent<P>, ctx: RenderContext): NotificationContent;
}

/**
 * Marks keys generated for callers who supplied none. The write path mints them
 * and the outbox reads them back to decide whether to debounce, so both sides
 * import these rather than repeating the prefix.
 */
const GENERATED_KEY_PREFIX = 'request:';

/** The `key` stored for a notification whose caller supplied none. */
export function generatedKey(requestId: string): string {
  return `${GENERATED_KEY_PREFIX}${requestId}`;
}

/**
 * Whether a row's `key` came from its caller. Only those rows can be replaced,
 * debounced, or retracted.
 */
export function isCallerKey(key: string): boolean {
  return !key.startsWith(GENERATED_KEY_PREFIX);
}

/**
 * Render one row's event.
 *
 * A plain call now that arity is fixed — kept as the single seam every render
 * goes through, and the place a future arity change would land.
 */
export function renderSingle<P extends NotificationParams>(
  type: NotificationTypeDefinition<P>,
  event: NotificationEvent<P>,
  ctx: RenderContext,
): NotificationContent {
  return type.render(event, ctx);
}

export function defineNotificationType<P extends NotificationParams>(
  definition: NotificationTypeDefinition<P>,
): NotificationTypeDefinition<P> {
  return definition;
}
