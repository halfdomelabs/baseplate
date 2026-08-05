import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { Prisma } from '@src/generated/prisma/client.js';

import type { AnyNotificationType } from '../registry.js';
import type { NotificationSegment } from './notification-content.js';
import type { RenderSource } from './notification-renderer.js';

import { notificationEmail } from '../channels/email.channel.js';
import { defineNotificationType } from '../registry.js';
import { segmentsToText } from './notification-content.js';
import { createNotificationRenderer } from './notification-renderer.js';

vi.mock('@src/services/error-logger.js', () => ({ logError: vi.fn() }));

/** The stored snapshot every test row carries, as plain strings. */
const FROZEN = { title: 'FROZEN v1', actionUrl: '/frozen' };

/** The same snapshot as `renderContent` hands it back: one text segment. */
const FROZEN_RENDERED: NotificationSegment[] = [
  { kind: 'text', text: 'FROZEN v1' },
];

/** Build a renderer whose registry holds exactly the supplied types. */
function rendererWith(
  notificationTypes: AnyNotificationType[],
): ReturnType<typeof createNotificationRenderer> {
  return createNotificationRenderer({ notificationTypes });
}

/**
 * The renderer's `renderContent`, wrapped so tests can call it directly.
 * Wrapped (not destructured) because `renderContent` is an interface method;
 * pulling it off the object bare would trip `@typescript-eslint/unbound-method`.
 */
function renderWith(
  notificationTypes: AnyNotificationType[],
): ReturnType<typeof createNotificationRenderer>['renderContent'] {
  const renderer = rendererWith(notificationTypes);
  return (row, ctx) => renderer.renderContent(row, ctx);
}

/** A persisted row whose frozen columns act as the recovery content. */
function makeRow(
  type: string,
  templateVersion: number,
  params: Prisma.JsonValue,
): RenderSource {
  return {
    id: 'n1',
    type,
    templateVersion,
    params,
    frozenContent: FROZEN,
  };
}

describe('renderContent (versioned render-at-read)', () => {
  it('renders LIVE from stored params, not the frozen snapshot', () => {
    const renderContent = renderWith([
      defineNotificationType({
        key: 'test.live',
        version: 1,
        topic: 'general',
        paramsSchema: z.object({ name: z.string() }),
        channels: ['inApp'],
        render: (params) => ({ title: `${params.name} commented` }),
      }),
    ]);

    const content = renderContent(makeRow('test.live', 1, { name: 'Alice' }));

    expect(content.title).toEqual([{ kind: 'text', text: 'Alice commented' }]);
    expect(segmentsToText(content.title)).toBe('Alice commented');
  });

  it('PINS a row to the renderer version that created it', () => {
    // v1 and v2 of the same type are both registered. A row stamped v1 must keep
    // rendering with v1 even though v2 is the newest — history is not rewritten.
    const renderContent = renderWith([
      defineNotificationType({
        key: 'test.versioned',
        version: 1,
        topic: 'general',
        paramsSchema: z.object({ name: z.string() }),
        channels: ['inApp'],
        render: (params) => ({ title: `v1: ${params.name}` }),
      }),
      defineNotificationType({
        key: 'test.versioned',
        version: 2,
        topic: 'general',
        paramsSchema: z.object({ name: z.string() }),
        channels: ['inApp'],
        render: (params) => ({ title: `v2: ${params.name}` }),
      }),
    ]);

    const oldRow = renderContent(makeRow('test.versioned', 1, { name: 'Al' }));
    const newRow = renderContent(makeRow('test.versioned', 2, { name: 'Al' }));

    expect(oldRow.title).toEqual([{ kind: 'text', text: 'v1: Al' }]);
    expect(newRow.title).toEqual([{ kind: 'text', text: 'v2: Al' }]);
  });

  it('renders content ATOMICALLY (segments, text and actionUrl from one render)', () => {
    const renderContent = renderWith([
      defineNotificationType({
        key: 'test.atomic',
        version: 1,
        topic: 'general',
        paramsSchema: z.object({ postId: z.string() }),
        channels: ['inApp'],
        render: (params) => ({
          title: 'commented on your post',
          actionUrl: `/posts/${params.postId}`,
        }),
      }),
    ]);

    const content = renderContent(makeRow('test.atomic', 1, { postId: 'p9' }));

    // The action URL is re-derived at read — not the frozen '/frozen' column.
    expect(content.actionUrl).toBe('/posts/p9');
    expect(segmentsToText(content.title)).toBe('commented on your post');
  });

  it('falls back to the frozen snapshot when the renderer is retired', () => {
    const renderContent = renderWith([]);
    const content = renderContent(makeRow('test.gone', 1, { name: 'Bob' }));
    expect(content.title).toEqual(FROZEN_RENDERED);
    expect(content.actionUrl).toBe('/frozen');
  });

  it('falls back to the frozen snapshot when stored params drift', () => {
    const renderContent = renderWith([
      defineNotificationType({
        key: 'test.drift',
        version: 1,
        topic: 'general',
        paramsSchema: z.object({ title: z.string() }),
        channels: ['inApp'],
        render: (params) => ({ title: params.title }),
      }),
    ]);

    // Row predates the `title` param → schema validation fails → frozen.
    const drifted = renderContent(makeRow('test.drift', 1, { old: 1 }));
    expect(drifted.title).toEqual(FROZEN_RENDERED);

    // Current shape still renders live.
    const current = renderContent(makeRow('test.drift', 1, { title: 'Hi' }));
    expect(current.title).toEqual([{ kind: 'text', text: 'Hi' }]);
  });

  it('rejects unsafe actionUrl schemes', () => {
    const renderContent = renderWith([
      defineNotificationType({
        key: 'test.unsafe-url',
        version: 1,
        topic: 'general',
        paramsSchema: z.object({}),
        channels: ['inApp'],
        render: () => ({
          title: 'hi',
          actionUrl: 'javascript:alert(1)',
        }),
      }),
    ]);

    expect(
      renderContent(makeRow('test.unsafe-url', 1, {})).actionUrl,
    ).toBeNull();
  });

  it('rejects an unsafe href in a LIVE renderer segment (falls back to frozen)', () => {
    // A renderer emitting a `javascript:` link must not reach the client: the
    // segment schema rejects it, render throws, and we fall back to frozen.
    const renderContent = renderWith([
      defineNotificationType({
        key: 'test.unsafe-segment',
        version: 1,
        topic: 'general',
        paramsSchema: z.object({}),
        channels: ['inApp'],
        render: () => ({
          title: [{ kind: 'link', text: 'click', url: 'javascript:alert(1)' }],
        }),
      }),
    ]);

    expect(renderContent(makeRow('test.unsafe-segment', 1, {})).title).toEqual(
      FROZEN_RENDERED,
    );
  });
});

describe('renderContent (title and body)', () => {
  const titleAndBody = defineNotificationType({
    key: 'test.both',
    version: 1,
    topic: 'general',
    paramsSchema: z.object({ who: z.string() }),
    channels: ['inApp'],
    render: (params) => ({
      title: `${params.who} signed in`,
      body: 'From a new device',
    }),
  });

  it('renders title and body as separate segment runs', () => {
    const content = rendererWith([titleAndBody]).renderContent(
      makeRow('test.both', 1, { who: 'Alice' }),
    );

    expect(content.title).toEqual([{ kind: 'text', text: 'Alice signed in' }]);
    expect(content.body).toEqual([{ kind: 'text', text: 'From a new device' }]);
  });

  it('leaves body null when a type renders only a title', () => {
    const titleOnly = defineNotificationType({
      key: 'test.title-only',
      version: 1,
      topic: 'general',
      paramsSchema: z.object({}),
      channels: ['inApp'],
      render: () => ({ title: 'Just a title' }),
    });

    expect(
      rendererWith([titleOnly]).renderContent(makeRow('test.title-only', 1, {}))
        .body,
    ).toBeNull();
  });
});

describe('render (aggregate state)', () => {
  // A keyed row stores the caller's recomputed aggregate, so `render` reads a
  // count out of `params` rather than being handed a batch of events. The same
  // renderer therefore covers one actor and many.
  const likesType = defineNotificationType({
    key: 'test.likes',
    version: 1,
    topic: 'general',
    paramsSchema: z.object({ sample: z.array(z.string()), count: z.number() }),
    channels: ['inApp'],
    render: (params) => {
      const [first] = params.sample;
      const others = params.count - 1;
      return {
        title: others > 0 ? `${first} and ${others} others` : `${first}`,
      };
    },
  });

  it('renders a single-event group from its stored state', () => {
    const content = renderWith([likesType])(
      makeRow('test.likes', 1, { sample: ['Alice'], count: 1 }),
    );

    expect(segmentsToText(content.title)).toBe('Alice');
  });

  it('renders a collapsed group from the same renderer', () => {
    const content = renderWith([likesType])(
      makeRow('test.likes', 1, { sample: ['Alice', 'Bob'], count: 4 }),
    );

    expect(segmentsToText(content.title)).toBe('Alice and 3 others');
  });
});

describe('createNotificationRenderer (registry construction invariant)', () => {
  it('throws at construction when a (key, version) pair is registered twice', () => {
    const first = defineNotificationType({
      key: 'test.dup',
      version: 1,
      topic: 'general',
      paramsSchema: z.object({}),
      channels: ['inApp'],
      render: () => ({ title: 'first' }),
    });
    const second = defineNotificationType({
      key: 'test.dup',
      version: 1,
      topic: 'general',
      paramsSchema: z.object({}),
      channels: ['inApp'],
      render: () => ({ title: 'second' }),
    });

    // The collision surfaces deterministically at runtime construction — citing
    // the duplicated identifier — not at whatever import happened to load first.
    expect(() => rendererWith([first, second])).toThrow(
      'Notification type "test.dup@1" is already defined',
    );
  });

  it('allows the same key across different versions', () => {
    expect(() =>
      rendererWith([
        defineNotificationType({
          key: 'test.multiversion',
          version: 1,
          topic: 'general',
          paramsSchema: z.object({}),
          channels: ['inApp'],
          render: () => ({ title: 'v1' }),
        }),
        defineNotificationType({
          key: 'test.multiversion',
          version: 2,
          topic: 'general',
          paramsSchema: z.object({}),
          channels: ['inApp'],
          render: () => ({ title: 'v2' }),
        }),
      ]),
    ).not.toThrow();
  });
});

describe('resolveParams (the channel-neutral half of a channel render)', () => {
  /** A component stands in for a real template; only identity is asserted. */
  const CommentEmail = Object.assign(() => null, {
    subject: 'Component subject',
    displayName: 'CommentEmail',
  }) as unknown as Parameters<typeof notificationEmail>[0];

  /** A type declaring an email override built from its own params. */
  const withOverride = defineNotificationType({
    key: 'test.override',
    version: 1,
    topic: 'general',
    paramsSchema: z.object({ name: z.string() }),
    channels: ['inApp', 'email'],
    render: (params) => ({ title: `${params.name} commented` }),
    renderers: {
      email: (params) => notificationEmail(CommentEmail, { name: params.name }),
    },
  });

  it('hands back the pinned type and its parsed params', () => {
    const renderer = rendererWith([withOverride]);

    const resolved = renderer.resolveParams(
      makeRow('test.override', 1, { name: 'Alice' }),
    );

    expect(resolved?.type.key).toBe('test.override');
    expect(resolved?.params).toEqual({ name: 'Alice' });
  });

  it('returns null when the pinned renderer is GONE', () => {
    expect(
      rendererWith([]).resolveParams(makeRow('test.retired', 9, { name: 'A' })),
    ).toBeNull();
  });

  it('returns null when stored params no longer satisfy the schema', () => {
    const renderer = rendererWith([withOverride]);

    expect(
      renderer.resolveParams(makeRow('test.override', 1, { wrongField: 1 })),
    ).toBeNull();
  });

  it('does not affect the feed: the same type still renders channel-neutral segments', () => {
    // The point of the whole feature — an override adapts one channel and
    // leaves `render` as the single source for everything else.
    const renderContent = renderWith([withOverride]);

    expect(
      renderContent(makeRow('test.override', 1, { name: 'Alice' })).title,
    ).toEqual([{ kind: 'text', text: 'Alice commented' }]);
  });
});
