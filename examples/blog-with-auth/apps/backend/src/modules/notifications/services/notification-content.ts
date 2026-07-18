import { z } from 'zod';

/** URL schemes permitted in rendered links (open-redirect boundary). */
const SAFE_URL_SCHEMES = new Set(['http:', 'https:', 'mailto:']);

/**
 * True for a site-relative path or an absolute URL with an allowed scheme.
 * Rejects `javascript:`, `data:`, and protocol-relative (`//evil.com`) URLs.
 */
export function isSafeUrl(url: string): boolean {
  if (url.startsWith('/') && !url.startsWith('//')) return true;
  try {
    return SAFE_URL_SCHEMES.has(new URL(url).protocol);
  } catch {
    return false;
  }
}

/**
 * A rendered content segment. The representation every channel renders; input
 * formats exist only in `toSegments`. Minimal by design: interpolation is
 * structural (values can't be confused with markup). Growing the union is
 * additive; shrinking it is a migration.
 */
export const notificationSegmentSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('text'),
    value: z.string(),
    bold: z.boolean().optional(),
  }),
  z.object({
    type: z.literal('link'),
    value: z.string(),
    href: z.string().refine(isSafeUrl, 'Unsafe URL scheme'),
  }),
]);

export type NotificationSegment = z.infer<typeof notificationSegmentSchema>;

/** Frozen segments as persisted. Parsed (not cast) when read back. */
export const notificationSegmentsSchema = z.array(notificationSegmentSchema);

/**
 * Locale-independent render inputs a type's `render` interpolates. The
 * render-at-read source of truth, so they must be JSON-serializable and
 * snapshot-complete.
 */
export type NotificationParams = Record<string, unknown>;

/** Locale supplied to `render` (read time for the feed). */
export interface RenderContext {
  locale: string;
}

/**
 * Where a notification points. A structured descriptor is routed to a URL at
 * READ time, so route changes don't strand stale links. Use a frozen `url` only
 * when the target can't be re-derived (signed downloads, one-time links,
 * external URLs).
 */
export type NotificationAction =
  | { kind: 'entity'; type: string; id: string }
  | { kind: 'url'; url: string };

/** The content a notification type produces from its params. */
export interface NotificationContent {
  /** Plain string or structured segments. */
  body?: string | NotificationSegment[];
  action?: NotificationAction;
}

/**
 * Content as served to clients: every field comes from a SINGLE render, so a
 * notification can never mix output from two renderer versions.
 */
export interface RenderedContent {
  segments: NotificationSegment[];
  fallbackText: string;
  actionUrl: string | null;
}

/**
 * Normalize authored content into the segment IR (the only place formats live)
 * AND validate it through the schema — so a renderer that emits an unsafe `href`
 * (e.g. `javascript:`) is rejected here, not surfaced to a channel or GraphQL.
 * Throws on invalid segments; callers that render at read catch and fall back.
 */
export function toSegments(
  body: string | NotificationSegment[] | undefined,
): NotificationSegment[] {
  if (!body) return [];
  const segments =
    typeof body === 'string' ? [{ type: 'text', value: body }] : body;
  return notificationSegmentsSchema.parse(segments);
}

/** Flatten segments to plain text for `fallbackText` (SMS / a11y / lists). */
export function segmentsToText(segments: NotificationSegment[]): string {
  return segments.map((segment) => segment.value).join('');
}
