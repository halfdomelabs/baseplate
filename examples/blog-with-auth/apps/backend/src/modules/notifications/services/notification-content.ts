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
 *
 * This vocabulary is closed and owned by the notifications module: every kind
 * must mean the same thing on every channel, since each one has to flatten it.
 */
const notificationSegmentSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('text'),
    text: z.string(),
  }),
  z.object({
    kind: z.literal('emphasis'),
    text: z.string(),
  }),
  z.object({
    kind: z.literal('link'),
    text: z.string(),
    url: z.string().refine(isSafeUrl, 'Unsafe URL scheme'),
  }),
]);

export type NotificationSegment = z.infer<typeof notificationSegmentSchema>;

/** A run of segments, validated as a whole when content is normalized. */
export const notificationSegmentsSchema = z.array(notificationSegmentSchema);

/** Authored text: a bare string, or segments when formatting is needed. */
export type NotificationText = string | NotificationSegment[];

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
  /**
   * The feed line, and the subject or OS-level title on channels that need one.
   * Separate from `body` so those channels don't have to invent a subject by
   * truncating a merged blob.
   */
  title: NotificationText;
  /** Optional detail shown beneath the title. */
  body?: NotificationText;
  /**
   * Where the notification points. Built by `render` at read time (typically via
   * the app's typed URL helpers), so route changes reach existing notifications.
   */
  actionUrl?: string;
}

/**
 * Content as served to clients. Always segments, never a bare string: authors
 * may write either, and normalizing once means exactly one shape reaches every
 * channel.
 */
export interface RenderedContent {
  title: NotificationSegment[];
  body: NotificationSegment[] | null;
  actionUrl: string | null;
}

/**
 * The snapshot stored alongside a notification, read only when the live render
 * cannot run — its renderer retired, or its params no longer validating.
 *
 * Plain strings rather than segments: this is the last-resort copy, so it needs
 * to be legible rather than formatted, and a flat string never needs migrating
 * when the segment vocabulary changes.
 *
 * Add any other static, params-derived data the app's own surfaces read. Nothing
 * resolved at read time belongs here — a signed URL or a live join goes on a
 * field added to the exported notification object type, since everything stored
 * here is frozen at write time and can go stale.
 */
export const frozenNotificationContentSchema = z.object({
  title: z.string(),
  body: z.string().optional(),
  actionUrl: z.string().optional(),
});

export type FrozenNotificationContent = z.infer<
  typeof frozenNotificationContentSchema
>;

/** Flatten segments to plain text, for surfaces without formatting (subjects, SMS, a11y). */
export function segmentsToText(segments: NotificationSegment[]): string {
  return segments.map((segment) => segment.text).join('');
}

/** Flatten rendered content into the snapshot persisted beside it. */
export function toFrozenContent(
  content: RenderedContent,
): FrozenNotificationContent {
  return {
    title: segmentsToText(content.title),
    body: content.body ? segmentsToText(content.body) : undefined,
    actionUrl: content.actionUrl ?? undefined,
  };
}

/**
 * Normalize authored text into the segment IR (the only place formats live) and
 * validate it through the schema — so a renderer that emits an unsafe `url`
 * (e.g. `javascript:`) is rejected here, not surfaced to a channel or GraphQL.
 * Throws on invalid segments; callers that render at read catch and fall back.
 */
export function toSegments(
  text: NotificationText | undefined,
): NotificationSegment[] {
  if (!text) return [];
  const segments = typeof text === 'string' ? [{ kind: 'text', text }] : text;
  return notificationSegmentsSchema.parse(segments);
}
