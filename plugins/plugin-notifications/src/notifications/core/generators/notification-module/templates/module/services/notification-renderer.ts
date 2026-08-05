// @ts-nocheck

import type { NotificationTopicKey } from '$constantsNotificationTopics';
import type { AnyNotificationType } from '$registry';
import type {
  NotificationContent,
  NotificationParams,
  RenderContext,
  RenderedContent,
} from '$servicesNotificationContent';
import type { Prisma } from '%prismaGeneratedImports';

import {
  frozenNotificationContentSchema,
  isSafeUrl,
  toSegments,
} from '$servicesNotificationContent';
import { logError } from '%errorHandlerServiceImports';

/** Default render locale until i18n lands. */
const DEFAULT_LOCALE = 'en';

/** Columns `renderContent` reads; the GraphQL field spreads this into its `select`. */
export const RENDER_SOURCE_SELECT = {
  id: true,
  type: true,
  templateVersion: true,
  params: true,
  frozenContent: true,
} satisfies Prisma.NotificationSelect;

/** Row shape `renderContent` accepts (feed/notify rows are supersets). */
export type RenderSource = Prisma.NotificationGetPayload<{
  select: typeof RENDER_SOURCE_SELECT;
}>;

/**
 * The frozen snapshot persisted at notify time — the recovery content used when
 * the row's renderer is gone or its params no longer validate. Parsed, not cast:
 * the DB guarantees no shape.
 *
 * Its plain strings become single text segments, so a caller sees the same shape
 * whichever path produced it. Formatting is lost, which is the accepted cost of
 * a fallback that never needs migrating.
 */
function frozenContent(row: RenderSource): RenderedContent {
  const parsed = frozenNotificationContentSchema.safeParse(row.frozenContent);
  if (!parsed.success) {
    return { title: [], body: null, actionUrl: null };
  }
  const { title, body, actionUrl } = parsed.data;
  return {
    title: [{ kind: 'text', text: title }],
    body: body === undefined ? null : [{ kind: 'text', text: body }],
    actionUrl: actionUrl && isSafeUrl(actionUrl) ? actionUrl : null,
  };
}

/**
 * What a row's topic lookup found.
 *
 * `unknown` is not `topicless`: a type in no topic consults no preference by
 * design, while a retired renderer means the topic cannot be determined at all.
 * A caller enforcing a preference has to tell those apart to avoid delivering
 * something the recipient silenced.
 */
export type TopicResolution =
  | { kind: 'topic'; key: NotificationTopicKey }
  | { kind: 'topicless' }
  | { kind: 'unknown' };

/** Registry key: a row's renderer is pinned by both its type and its version. */
function registryKey(key: string, version: number): string {
  return `${key}@${version}`;
}

/** Project a renderer's output into the served content (one render, all fields). */
function toRenderedContent(content: NotificationContent): RenderedContent {
  return {
    title: toSegments(content.title),
    body: content.body === undefined ? null : toSegments(content.body),
    // Dropped rather than stored when unsafe: a `javascript:` action would
    // otherwise reach the client, which link segments are already guarded from
    // by the segment schema.
    actionUrl:
      content.actionUrl && isSafeUrl(content.actionUrl)
        ? content.actionUrl
        : null,
  };
}

/**
 * Resolves notification types and renders stored rows. Holds no I/O: no prisma,
 * no pubsub, no channels — so it is safe to construct anywhere the persistence
 * service is not wanted (delivery workers, unit tests).
 */
export interface NotificationRenderer {
  /**
   * Render a row's content at read time, atomically: title, body, actionUrl and
   * extraData all come from a single invocation of the renderer that created
   * the row — resolved by `(type, templateVersion)` against the per-runtime
   * registry, never "whatever is deployed now". A copy/param refactor bumps the
   * version, so history can't be silently rewritten. Falls back to the frozen
   * snapshot (and logs) when the pinned renderer is gone or params no longer
   * satisfy it.
   */
  renderContent(row: RenderSource, ctx?: RenderContext): RenderedContent;
  /**
   * Render content for not-yet-persisted params, in the default locale. What
   * `notify` flattens into the frozen snapshot it stores.
   */
  renderForWrite(
    type: AnyNotificationType,
    params: NotificationParams,
  ): RenderedContent;
  /**
   * A row's topic, resolved from the registry rather than the row — the topic
   * is a property of the type, so it is never stored per row.
   *
   * Three outcomes, deliberately distinct: a type in a topic, a type in none,
   * and a row whose pinned renderer is gone. Collapsing the last two would make
   * a retired renderer look unsuppressible, so a preference check could not tell
   * "consults no preference by design" from "cannot tell what it consults".
   */
  getTopic(type: string, templateVersion: number): TopicResolution;
  /**
   * The type a row is pinned to, or null when that renderer is gone. Read by
   * the outbox, which needs the type itself to re-resolve params at delivery.
   */
  getType(type: string, templateVersion: number): AnyNotificationType | null;
  /**
   * Parse a row's stored params against its pinned type, or null when the type
   * is retired or the params no longer satisfy it.
   *
   * What a channel needs to run that type's own renderer: the registry lookup
   * and the parse, without an opinion about which channel is asking. The
   * channel-specific half — invoking its renderer and deciding what a failure
   * means — belongs to the channel.
   */
  resolveParams(
    row: RenderSource,
  ): { type: AnyNotificationType; params: NotificationParams } | null;
}

/**
 * Render content for not-yet-persisted params, in the default locale. Outside
 * the factory because it consults no registry — the caller passes the type in.
 */
function renderForWrite(
  type: AnyNotificationType,
  params: NotificationParams,
): RenderedContent {
  return toRenderedContent(type.render(params, { locale: DEFAULT_LOCALE }));
}

/**
 * Creates the {@link NotificationRenderer} over a fixed set of types.
 *
 * Duplicate `(key, version)` pairs fail here — deterministically at runtime
 * construction — instead of at whatever import happened to load a colliding
 * definition first.
 */
export function createNotificationRenderer(deps: {
  notificationTypes: AnyNotificationType[];
}): NotificationRenderer {
  const { notificationTypes } = deps;

  const registry = new Map<string, AnyNotificationType>();
  for (const type of notificationTypes) {
    const id = registryKey(type.key, type.version);
    if (registry.has(id)) {
      throw new Error(`Notification type "${id}" is already defined`);
    }
    registry.set(id, type);
  }

  function renderContent(
    row: RenderSource,
    ctx?: RenderContext,
  ): RenderedContent {
    const type = registry.get(registryKey(row.type, row.templateVersion));
    if (!type) {
      logError(
        new Error(
          `No renderer for notification "${row.type}@${row.templateVersion}"`,
        ),
        { source: 'notification-render', notificationId: row.id },
      );
      return frozenContent(row);
    }

    const params = type.paramsSchema.safeParse(row.params ?? {});
    if (!params.success) {
      logError(params.error, {
        source: 'notification-render',
        reason: 'params-drift',
        notificationId: row.id,
        type: `${row.type}@${row.templateVersion}`,
      });
      return frozenContent(row);
    }

    try {
      return toRenderedContent(
        type.render(params.data, ctx ?? { locale: DEFAULT_LOCALE }),
      );
    } catch (error) {
      logError(error, {
        source: 'notification-render',
        reason: 'render-threw',
        notificationId: row.id,
        type: `${row.type}@${row.templateVersion}`,
      });
      return frozenContent(row);
    }
  }

  function getTopic(type: string, templateVersion: number): TopicResolution {
    const registered = registry.get(registryKey(type, templateVersion));
    if (!registered) return { kind: 'unknown' };
    return registered.topic === undefined
      ? { kind: 'topicless' }
      : { kind: 'topic', key: registered.topic };
  }

  function getType(
    type: string,
    templateVersion: number,
  ): AnyNotificationType | null {
    return registry.get(registryKey(type, templateVersion)) ?? null;
  }

  function resolveParams(
    row: RenderSource,
  ): { type: AnyNotificationType; params: NotificationParams } | null {
    const type = registry.get(registryKey(row.type, row.templateVersion));
    // A retired renderer is already reported by `renderContent`, which every
    // caller of this also calls, so it is not logged twice here.
    if (!type) return null;

    const parsed = type.paramsSchema.safeParse(row.params ?? {});
    if (!parsed.success) {
      logError(parsed.error, {
        source: 'notification-render',
        reason: 'params-drift',
        notificationId: row.id,
        type: `${row.type}@${row.templateVersion}`,
      });
      return null;
    }

    return { type, params: parsed.data };
  }

  return { renderContent, renderForWrite, getTopic, getType, resolveParams };
}
