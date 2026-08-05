import type { z } from 'zod';

import type {
  NotificationRenderers,
  NotificationRoutingTarget,
} from './channels/types.js';
import type { NotificationTopicKey } from './constants/notification-topics.js';
import type {
  NotificationContent,
  NotificationParams,
  RenderContext,
} from './services/notification-content.js';

/** A schema whose output is usable as notification params. */
export type NotificationParamsSchema = z.ZodType<NotificationParams>;

/** What `resolveParams` is told about the window it is resolving for. */
export interface ResolveParamsContext {
  /**
   * The delta boundary: only activity after this is new to the recipient. Null
   * on the write path, where the row holds state rather than a delta.
   *
   * Per channel, so a digest measures from the last email rather than from
   * whatever the feed did meanwhile.
   */
  since: Date | null;
}

/**
 * Fields shared by both type shapes. Parameterised by the params schema, which
 * the params themselves are derived from with `z.output`.
 */
interface NotificationTypeBase<PSchema extends NotificationParamsSchema> {
  /** Stable key stored on the row, e.g. "post.commented". */
  key: string;
  /** Renderer version stored on the row. Bump on breaking copy/param changes. */
  version: number;
  /**
   * The topic this type belongs to, if any.
   */
  topic?: NotificationTopicKey;
  /** Validates stored params before render; failure falls back to the snapshot. */
  paramsSchema: PSchema;
  /**
   * Allowed channels for this type.
   */
  channels?: readonly NotificationRoutingTarget[];
  /**
   * Builds the content from stored params.
   *
   * Params are the whole input: whoever triggered the notification travels in
   * them, typed by this type's own `paramsSchema`, so names render from the same
   * source on every channel.
   */
  render(params: z.output<PSchema>, ctx: RenderContext): NotificationContent;
  /**
   * Per-channel overrides of what `render` produced.
   *
   * Capability, not policy: declaring one does not narrow `channels`, and
   * omitting one does not widen it. A channel with no override — or whose
   * override fails — falls back to the default wrapper built from `render`.
   */
  renderers?: NotificationRenderers<z.output<PSchema>>;
}

/**
 * A type whose caller passes finished `params`.
 *
 * `render` must be pure and synchronous (it runs per row per request).
 *
 * Write copy **state-phrased** ("Alice, Bob and 3 others liked your post")
 * rather than delta-phrased ("3 new likes"): a collapsed row holds current
 * state, and `render` sees only that state, never what changed since last time.
 */
export interface PlainNotificationType<
  PSchema extends NotificationParamsSchema = NotificationParamsSchema,
> extends NotificationTypeBase<PSchema> {
  readonly kind: 'plain';
  /**
   * Derives the collapse/retraction key from the caller's params.
   *
   * Absent, every call is its own row: non-collapsing and non-retractable, the
   * fire-and-forget default.
   */
  groupKey?: (params: z.output<PSchema>) => string;
}

/**
 * A type that computes its own `params` from a smaller `input`.
 *
 * The difference from a plain type is who computes the params — not idempotency
 * and not retractability, both of which either shape gets from `groupKey`. A batched
 * type exists so the caller can say "this post was liked" and let the type read
 * the current like count, rather than every call site re-deriving the aggregate.
 */
export interface BatchedNotificationType<
  PSchema extends NotificationParamsSchema = NotificationParamsSchema,
  ISchema extends z.ZodType = z.ZodType,
> extends NotificationTypeBase<PSchema> {
  readonly kind: 'batched';
  /** Validates the caller's input before `resolveParams` sees it. */
  inputSchema: ISchema;
  /**
   * Derives the collapse/retraction key from the caller's input.
   */
  groupKey: (input: z.output<ISchema>) => string;
  /**
   * Reads current state and produces the params `render` will see. May query —
   * unlike `render`, which must stay pure and synchronous.
   *
   * Runs at write time with `since: null`, storing current state, and again per
   * outbound send with `since` set to that channel's last delivery, whose
   * result is used for that send alone and never written back.
   *
   * Must be read-only and idempotent: the delivery call sits in the worker's
   * retry path. The stored params must also satisfy `inputSchema`, since
   * delivery has only the row to recover the input from — otherwise the delta
   * is skipped and the stored state is sent instead.
   */
  resolveParams(
    input: z.output<ISchema>,
    ctx: ResolveParamsContext,
  ): Promise<z.output<PSchema>>;
}

/**
 * Any type, as a heterogeneous collection holds it.
 */
export type AnyNotificationType =
  PlainNotificationType | BatchedNotificationType;

/**
 * Marks keys generated for types that derive none. The write path mints them
 * and the outbox reads them back to decide whether to debounce, so both sides
 * import these rather than repeating the prefix.
 */
const GENERATED_KEY_PREFIX = 'request:';

/** The `groupKey` stored for a notification whose type derives none. */
export function generatedKey(requestId: string): string {
  return `${GENERATED_KEY_PREFIX}${requestId}`;
}

/** Whether a row's `groupKey` was minted for it rather than derived by its type. */
export function isGeneratedKey(groupKey: string): boolean {
  return groupKey.startsWith(GENERATED_KEY_PREFIX);
}

/**
 * Defines a type whose caller passes finished params.
 */
export function defineNotificationType<
  PSchema extends NotificationParamsSchema,
>(
  definition: Omit<PlainNotificationType<PSchema>, 'kind'>,
): PlainNotificationType<PSchema> {
  return { ...definition, kind: 'plain' };
}

/**
 * Defines a type that resolves its own params from a smaller input.
 */
export function defineBatchedNotificationType<
  PSchema extends NotificationParamsSchema,
  ISchema extends z.ZodType,
>(
  definition: Omit<BatchedNotificationType<PSchema, ISchema>, 'kind'>,
): BatchedNotificationType<PSchema, ISchema> {
  return { ...definition, kind: 'batched' };
}
