// @ts-nocheck

import type {
  NotificationContent,
  NotificationParams,
  RenderContext,
  RenderedContent,
} from '$servicesNotificationContent';
import type {
  NotificationActor,
  NotificationEvent,
  NotificationTypeDefinition,
} from '$servicesNotificationRegistry';
import type { Prisma } from '%prismaGeneratedImports';

import {
  isSafeUrl,
  notificationSegmentsSchema,
  segmentsToText,
  toSegments,
} from '$servicesNotificationContent';
import { renderSingle } from '$servicesNotificationRegistry';
import { logError } from '%errorHandlerServiceImports';

/** Default render locale until i18n lands. */
export const DEFAULT_LOCALE = 'en';

/** Columns `renderContent` reads; the GraphQL field spreads this into its `select`. */
export const RENDER_SOURCE_SELECT = {
  id: true,
  type: true,
  templateVersion: true,
  params: true,
  segments: true,
  fallbackText: true,
  actionUrl: true,
  actorId: true,
  actorLabel: true,
  entityType: true,
  entityId: true,
} satisfies Prisma.NotificationSelect;

/** Row shape `renderContent` accepts (feed/notify rows are supersets). */
export type RenderSource = Prisma.NotificationGetPayload<{
  select: typeof RENDER_SOURCE_SELECT;
}>;

/**
 * The frozen snapshot persisted at notify time — the recovery content used when
 * the row's renderer is gone or its params no longer validate. Parsed, not cast:
 * the DB guarantees no shape.
 */
function frozenContent(row: RenderSource): RenderedContent {
  const parsed = notificationSegmentsSchema.safeParse(row.segments);
  return {
    segments: parsed.success ? parsed.data : [],
    fallbackText: row.fallbackText,
    actionUrl: row.actionUrl,
  };
}

/** Registry key: a row's renderer is pinned by BOTH its type and its version. */
function registryKey(key: string, version: number): string {
  return `${key}@${version}`;
}

/** Project a renderer's output into the served content (one render, all fields). */
export function toRenderedContent(
  content: NotificationContent,
): RenderedContent {
  const segments = toSegments(content.body);
  const actionUrl =
    content.actionUrl && isSafeUrl(content.actionUrl)
      ? content.actionUrl
      : null;
  return {
    segments,
    fallbackText: segmentsToText(segments),
    actionUrl,
  };
}

/**
 * Resolves notification types and renders stored rows. Holds no I/O: no prisma,
 * no pubsub, no channels — so it is safe to construct anywhere the persistence
 * service is not wanted (delivery workers, unit tests).
 */
export interface NotificationRenderer {
  /**
   * Render a row's content at read time, ATOMICALLY: segments, fallbackText and
   * actionUrl all come from a single invocation of the renderer that CREATED
   * the row — resolved by `(type, templateVersion)` against the per-runtime
   * registry, never "whatever is deployed now". A copy/param refactor bumps the
   * version, so history can't be silently rewritten. Falls back to the frozen
   * snapshot (and logs) when the pinned renderer is gone or params no longer
   * satisfy it.
   *
   * `actor` overrides the row's `actorLabel` snapshot with live identity, for
   * callers that already resolved it (the delivery path). Omit it on the read
   * path, which has only the row.
   */
  renderContent(
    row: RenderSource,
    ctx?: RenderContext,
    actor?: NotificationActor,
  ): RenderedContent;
  /**
   * Render content for a not-yet-persisted event, in the default locale. The
   * frozen snapshot `notify` stores as read-time recovery content.
   */
  renderForWrite<P extends NotificationParams>(
    type: NotificationTypeDefinition<P>,
    event: NotificationEvent<P>,
  ): RenderedContent;
  /**
   * A row's category, resolved from the registry rather than the row — the
   * category is a property of the type, so it is never stored per row. Null
   * when the pinned renderer is gone.
   */
  getCategory(type: string, templateVersion: number): string | null;
}

/**
 * Creates the {@link NotificationRenderer} over a fixed set of types.
 *
 * Duplicate `(key, version)` pairs fail HERE — deterministically at runtime
 * construction — instead of at whatever import happened to load a colliding
 * definition first.
 */
export function createNotificationRenderer(deps: {
  notificationTypes: NotificationTypeDefinition[];
}): NotificationRenderer {
  const { notificationTypes } = deps;

  const registry = new Map<string, NotificationTypeDefinition>();
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
    actor?: NotificationActor,
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

    // Live identity where the caller resolved it, else the write-time snapshot
    // — which is also what names an actor whose user row is gone.
    const event: NotificationEvent = {
      params: params.data,
      actor: actor ?? (row.actorLabel ? { label: row.actorLabel } : undefined),
      entityType: row.entityType ?? undefined,
      entityId: row.entityId ?? undefined,
    };

    try {
      return toRenderedContent(
        renderSingle(type, event, ctx ?? { locale: DEFAULT_LOCALE }),
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

  function renderForWrite<P extends NotificationParams>(
    type: NotificationTypeDefinition<P>,
    event: NotificationEvent<P>,
  ): RenderedContent {
    return toRenderedContent(
      renderSingle(type, event, { locale: DEFAULT_LOCALE }),
    );
  }

  function getCategory(type: string, templateVersion: number): string | null {
    return registry.get(registryKey(type, templateVersion))?.category ?? null;
  }

  return { renderContent, renderForWrite, getCategory };
}
