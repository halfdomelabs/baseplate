import type { z } from 'zod';

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
   */
  category: string;
  /** Validates stored params before render; failure falls back to the snapshot. */
  paramsSchema: z.ZodType<P>;
  /** Routing targets for this type. */
  channels: readonly NotificationRoutingTarget[];
}

/**
 * The default shape: one event in, one render out.
 *
 * Takes the event itself rather than a one-element array, so a renderer cannot
 * be written to destructure a batch it never opted into receiving.
 */
export interface SingleNotificationType<
  P extends NotificationParams = NotificationParams,
> extends NotificationTypeBase<P> {
  aggregate?: undefined;
  render(event: NotificationEvent<P>, ctx: RenderContext): NotificationContent;
}

/**
 * The batched shape: opts into aggregation and receives every event in the
 * group ("Alice, Bob and 1 other commented").
 *
 * `aggregate` and the array-taking `render` are declared together so the two
 * cannot disagree — only a type that declared a grouping key can be batched.
 */
export interface AggregatableNotificationType<
  P extends NotificationParams = NotificationParams,
> extends NotificationTypeBase<P> {
  /**
   * Which of the event's identity fields collapse into one group, e.g.
   * `['entityType', 'entityId']` for "N people liked this post".
   *
   * Field names rather than a `(event) => string` callback: a callback over
   * `NotificationEvent<P>` puts `P` in a parameter position, which makes the
   * definition contravariant in `P` and stops `NotificationTypeDefinition<P>`
   * assigning to the erased form the registry stores.
   */
  aggregate: {
    groupBy: readonly ('entityType' | 'entityId')[];
  };
  render(
    events: [NotificationEvent<P>, ...NotificationEvent<P>[]],
    ctx: RenderContext,
  ): NotificationContent;
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
 * Arity is part of the contract: a type either renders one event or declares
 * itself aggregatable and renders a batch. A single-event renderer therefore
 * cannot silently receive five and render only the first.
 *
 * `render` MUST be pure and synchronous (it runs per row per request).
 */
export type NotificationTypeDefinition<
  P extends NotificationParams = NotificationParams,
> = SingleNotificationType<P> | AggregatableNotificationType<P>;

/** Narrows a definition to the batchable shape (the digest engine's gate). */
export function isAggregatable<P extends NotificationParams>(
  type: NotificationTypeDefinition<P>,
): type is AggregatableNotificationType<P> {
  return type.aggregate !== undefined;
}

/**
 * Render a single event, whichever shape the type declared.
 *
 * The one place the union is collapsed, so callers with exactly one event do
 * not each re-derive which signature to call.
 */
export function renderSingle<P extends NotificationParams>(
  type: NotificationTypeDefinition<P>,
  event: NotificationEvent<P>,
  ctx: RenderContext,
): NotificationContent {
  return isAggregatable(type)
    ? type.render([event], ctx)
    : type.render(event, ctx);
}

/**
 * Overloaded per shape, not taking the union directly: a union parameter leaves
 * `render`'s argument without a contextual type, so `events`/`event` would
 * infer as `any`.
 */
export function defineNotificationType<P extends NotificationParams>(
  definition: AggregatableNotificationType<P>,
): AggregatableNotificationType<P>;
export function defineNotificationType<P extends NotificationParams>(
  definition: SingleNotificationType<P>,
): SingleNotificationType<P>;
export function defineNotificationType<P extends NotificationParams>(
  definition: NotificationTypeDefinition<P>,
): NotificationTypeDefinition<P> {
  return definition;
}
