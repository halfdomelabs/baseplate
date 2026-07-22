// @ts-nocheck

import { z } from 'zod';

/** URL schemes permitted in rendered links (open-redirect boundary). */
const SAFE_URL_SCHEMES = new Set(['http:', 'https:', 'mailto:']);

/** Dummy base so a site-relative path resolves to an allowed http(s) scheme. */
const RELATIVE_URL_BASE = 'https://relative.invalid';

/**
 * True for a site-relative path or an absolute URL with an allowed scheme
 * (`http:`, `https:`, `mailto:`); rejects `javascript:`, `data:`, etc.
 *
 * The URL is resolved through the WHATWG parser — never by string prefix — so a
 * link the parser sees as safe is exactly what the browser navigates to. String
 * checks split from browser parsing on `\` and control chars (`/\evil.com`
 * normalizes to `//evil.com`), which is how prefix-based allowlists get bypassed.
 */
export function isSafeUrl(url: string): boolean {
  try {
    return SAFE_URL_SCHEMES.has(new URL(url, RELATIVE_URL_BASE).protocol);
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

/** The content a notification type produces from its params. */
export interface NotificationContent {
  /** Plain string or structured segments. */
  body?: string | NotificationSegment[];
  /**
   * Where the notification points. Built by `render` at read time (typically via
   * the app's typed URL helpers), so route changes reach existing notifications.
   */
  actionUrl?: string;
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
