import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { Prisma } from '@src/generated/prisma/client.js';

import type { NotificationSegment } from './notification-content.js';
import type { NotificationTypeDefinition } from './notification-registry.js';
import type { RenderSource } from './notification-renderer.js';

import { defineNotificationType } from './notification-registry.js';
import { createNotificationRenderer } from './notification-renderer.js';

vi.mock('@src/services/error-logger.js', () => ({ logError: vi.fn() }));

const FROZEN: NotificationSegment[] = [{ type: 'text', value: 'FROZEN v1' }];

/** Build a renderer whose registry holds exactly the supplied types. */
function rendererWith(
  notificationTypes: NotificationTypeDefinition[],
): ReturnType<typeof createNotificationRenderer> {
  return createNotificationRenderer({ notificationTypes });
}

/**
 * The renderer's `renderContent`, wrapped so tests can call it directly.
 * Wrapped (not destructured) because `renderContent` is an interface method;
 * pulling it off the object bare would trip `@typescript-eslint/unbound-method`.
 */
function renderWith(
  notificationTypes: NotificationTypeDefinition[],
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
    segments: FROZEN,
    fallbackText: 'FROZEN v1',
    actionUrl: '/frozen',
    actorId: null,
    actorLabel: null,
    entityType: null,
    entityId: null,
  };
}

describe('renderContent (versioned render-at-read)', () => {
  it('renders LIVE from stored params, not the frozen snapshot', () => {
    const renderContent = renderWith([
      defineNotificationType({
        key: 'test.live',
        version: 1,
        category: 'test',
        paramsSchema: z.object({ name: z.string() }),
        channels: ['inApp'],
        render: (event) => ({ body: `${event.params.name} commented` }),
      }),
    ]);

    const content = renderContent(makeRow('test.live', 1, { name: 'Alice' }));

    expect(content.segments).toEqual([
      { type: 'text', value: 'Alice commented' },
    ]);
    expect(content.fallbackText).toBe('Alice commented');
  });

  it('PINS a row to the renderer version that created it', () => {
    // v1 and v2 of the same type are both registered. A row stamped v1 must keep
    // rendering with v1 even though v2 is the newest — history is not rewritten.
    const renderContent = renderWith([
      defineNotificationType({
        key: 'test.versioned',
        version: 1,
        category: 'test',
        paramsSchema: z.object({ name: z.string() }),
        channels: ['inApp'],
        render: (event) => ({ body: `v1: ${event.params.name}` }),
      }),
      defineNotificationType({
        key: 'test.versioned',
        version: 2,
        category: 'test',
        paramsSchema: z.object({ name: z.string() }),
        channels: ['inApp'],
        render: (event) => ({ body: `v2: ${event.params.name}` }),
      }),
    ]);

    const oldRow = renderContent(makeRow('test.versioned', 1, { name: 'Al' }));
    const newRow = renderContent(makeRow('test.versioned', 2, { name: 'Al' }));

    expect(oldRow.segments).toEqual([{ type: 'text', value: 'v1: Al' }]);
    expect(newRow.segments).toEqual([{ type: 'text', value: 'v2: Al' }]);
  });

  it('renders content ATOMICALLY (segments, text and actionUrl from one render)', () => {
    const renderContent = renderWith([
      defineNotificationType({
        key: 'test.atomic',
        version: 1,
        category: 'test',
        paramsSchema: z.object({ postId: z.string() }),
        channels: ['inApp'],
        render: (event) => ({
          body: 'commented on your post',
          actionUrl: `/posts/${event.params.postId}`,
        }),
      }),
    ]);

    const content = renderContent(makeRow('test.atomic', 1, { postId: 'p9' }));

    // The action URL is re-derived at read — NOT the frozen '/frozen' column.
    expect(content.actionUrl).toBe('/posts/p9');
    expect(content.fallbackText).toBe('commented on your post');
  });

  it('falls back to the frozen snapshot when the renderer is retired', () => {
    const renderContent = renderWith([]);
    const content = renderContent(makeRow('test.gone', 1, { name: 'Bob' }));
    expect(content.segments).toEqual(FROZEN);
    expect(content.actionUrl).toBe('/frozen');
  });

  it('falls back to the frozen snapshot when stored params drift', () => {
    const renderContent = renderWith([
      defineNotificationType({
        key: 'test.drift',
        version: 1,
        category: 'test',
        paramsSchema: z.object({ title: z.string() }),
        channels: ['inApp'],
        render: (event) => ({ body: event.params.title }),
      }),
    ]);

    // Row predates the `title` param → schema validation fails → frozen.
    const drifted = renderContent(makeRow('test.drift', 1, { old: 1 }));
    expect(drifted.segments).toEqual(FROZEN);

    // Current shape still renders live.
    const current = renderContent(makeRow('test.drift', 1, { title: 'Hi' }));
    expect(current.segments).toEqual([{ type: 'text', value: 'Hi' }]);
  });

  it('rejects unsafe actionUrl schemes', () => {
    const renderContent = renderWith([
      defineNotificationType({
        key: 'test.unsafe-url',
        version: 1,
        category: 'test',
        paramsSchema: z.object({}),
        channels: ['inApp'],
        render: () => ({
          body: 'hi',
          actionUrl: 'javascript:alert(1)',
        }),
      }),
    ]);

    expect(
      renderContent(makeRow('test.unsafe-url', 1, {})).actionUrl,
    ).toBeNull();
  });

  it('rejects an unsafe href in a LIVE renderer segment (falls back to frozen)', () => {
    // A renderer emitting a `javascript:` link must NOT reach the client: the
    // segment schema rejects it, render throws, and we fall back to frozen.
    const renderContent = renderWith([
      defineNotificationType({
        key: 'test.unsafe-segment',
        version: 1,
        category: 'test',
        paramsSchema: z.object({}),
        channels: ['inApp'],
        render: () => ({
          body: [{ type: 'link', value: 'click', href: 'javascript:alert(1)' }],
        }),
      }),
    ]);

    expect(
      renderContent(makeRow('test.unsafe-segment', 1, {})).segments,
    ).toEqual(FROZEN);
  });
});

describe('renderContent (actor identity)', () => {
  /** A type whose copy is entirely the actor label, so tests read the chain. */
  const actorEcho = defineNotificationType({
    key: 'test.actor',
    version: 1,
    category: 'test',
    paramsSchema: z.object({}),
    channels: ['inApp'],
    render: (event) => ({ body: event.actor?.label ?? 'someone' }),
  });

  function renderActor(row: RenderSource, actor?: { label: string }): string {
    return rendererWith([actorEcho]).renderContent(row, undefined, actor)
      .fallbackText;
  }

  it('prefers a caller-resolved actor over the row snapshot', () => {
    const row = { ...makeRow('test.actor', 1, {}), actorLabel: 'Old Name' };

    expect(renderActor(row, { label: 'New Name' })).toBe('New Name');
  });

  it('falls back to the actorLabel snapshot when no actor is passed', () => {
    const row = { ...makeRow('test.actor', 1, {}), actorLabel: 'Snapshot' };

    expect(renderActor(row)).toBe('Snapshot');
  });

  it('leaves the actor undefined when the row has no snapshot', () => {
    expect(renderActor(makeRow('test.actor', 1, {}))).toBe('someone');
  });
});

describe('renderSingle (arity dispatch)', () => {
  it('hands an aggregatable type a one-event batch', () => {
    const renderContent = renderWith([
      defineNotificationType({
        key: 'test.aggregatable',
        version: 1,
        category: 'test',
        paramsSchema: z.object({ name: z.string() }),
        channels: ['inApp'],
        aggregate: { groupBy: ['entityType', 'entityId'] },
        render: (events) => ({
          body: `${events[0].params.name} +${events.length - 1}`,
        }),
      }),
    ]);

    const content = renderContent(
      makeRow('test.aggregatable', 1, { name: 'Alice' }),
    );

    expect(content.fallbackText).toBe('Alice +0');
  });
});

describe('createNotificationRenderer (registry construction invariant)', () => {
  it('throws at construction when a (key, version) pair is registered twice', () => {
    const first = defineNotificationType({
      key: 'test.dup',
      version: 1,
      category: 'test',
      paramsSchema: z.object({}),
      channels: ['inApp'],
      render: () => ({ body: 'first' }),
    });
    const second = defineNotificationType({
      key: 'test.dup',
      version: 1,
      category: 'test',
      paramsSchema: z.object({}),
      channels: ['inApp'],
      render: () => ({ body: 'second' }),
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
          category: 'test',
          paramsSchema: z.object({}),
          channels: ['inApp'],
          render: () => ({ body: 'v1' }),
        }),
        defineNotificationType({
          key: 'test.multiversion',
          version: 2,
          category: 'test',
          paramsSchema: z.object({}),
          channels: ['inApp'],
          render: () => ({ body: 'v2' }),
        }),
      ]),
    ).not.toThrow();
  });
});
