import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { Prisma } from '@src/generated/prisma/client.js';

import type { NotificationSegment } from './notification-content.js';
import type { RenderSource } from './notification.service.js';

import { defineNotificationType } from './notification-registry.js';
import { renderContent } from './notification.service.js';

vi.mock('@src/services/error-logger.js', () => ({ logError: vi.fn() }));

const FROZEN: NotificationSegment[] = [{ type: 'text', value: 'FROZEN v1' }];

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
    entityType: null,
    entityId: null,
  };
}

describe('renderContent (versioned render-at-read)', () => {
  it('renders LIVE from stored params, not the frozen snapshot', () => {
    defineNotificationType({
      key: 'test.live',
      version: 1,
      paramsSchema: z.object({ name: z.string() }),
      channels: ['inApp'],
      render: ([event]) => ({ body: `${event.params.name} commented` }),
    });

    const content = renderContent(makeRow('test.live', 1, { name: 'Alice' }));

    expect(content.segments).toEqual([
      { type: 'text', value: 'Alice commented' },
    ]);
    expect(content.fallbackText).toBe('Alice commented');
  });

  it('PINS a row to the renderer version that created it', () => {
    // v1 and v2 of the same type are both registered. A row stamped v1 must keep
    // rendering with v1 even though v2 is the newest — history is not rewritten.
    defineNotificationType({
      key: 'test.versioned',
      version: 1,
      paramsSchema: z.object({ name: z.string() }),
      channels: ['inApp'],
      render: ([event]) => ({ body: `v1: ${event.params.name}` }),
    });
    defineNotificationType({
      key: 'test.versioned',
      version: 2,
      paramsSchema: z.object({ name: z.string() }),
      channels: ['inApp'],
      render: ([event]) => ({ body: `v2: ${event.params.name}` }),
    });

    const oldRow = renderContent(makeRow('test.versioned', 1, { name: 'Al' }));
    const newRow = renderContent(makeRow('test.versioned', 2, { name: 'Al' }));

    expect(oldRow.segments).toEqual([{ type: 'text', value: 'v1: Al' }]);
    expect(newRow.segments).toEqual([{ type: 'text', value: 'v2: Al' }]);
  });

  it('renders content ATOMICALLY (segments, text and actionUrl from one render)', () => {
    defineNotificationType({
      key: 'test.atomic',
      version: 1,
      paramsSchema: z.object({ postId: z.string() }),
      channels: ['inApp'],
      render: ([event]) => ({
        body: 'commented on your post',
        actionUrl: `/posts/${event.params.postId}`,
      }),
    });

    const content = renderContent(makeRow('test.atomic', 1, { postId: 'p9' }));

    // The action URL is re-derived at read — NOT the frozen '/frozen' column.
    expect(content.actionUrl).toBe('/posts/p9');
    expect(content.fallbackText).toBe('commented on your post');
  });

  it('falls back to the frozen snapshot when the renderer is retired', () => {
    const content = renderContent(makeRow('test.gone', 1, { name: 'Bob' }));
    expect(content.segments).toEqual(FROZEN);
    expect(content.actionUrl).toBe('/frozen');
  });

  it('falls back to the frozen snapshot when stored params drift', () => {
    defineNotificationType({
      key: 'test.drift',
      version: 1,
      paramsSchema: z.object({ title: z.string() }),
      channels: ['inApp'],
      render: ([event]) => ({ body: event.params.title }),
    });

    // Row predates the `title` param → schema validation fails → frozen.
    const drifted = renderContent(makeRow('test.drift', 1, { old: 1 }));
    expect(drifted.segments).toEqual(FROZEN);

    // Current shape still renders live.
    const current = renderContent(makeRow('test.drift', 1, { title: 'Hi' }));
    expect(current.segments).toEqual([{ type: 'text', value: 'Hi' }]);
  });

  it('rejects unsafe actionUrl schemes', () => {
    defineNotificationType({
      key: 'test.unsafe-url',
      version: 1,
      paramsSchema: z.object({}),
      channels: ['inApp'],
      render: () => ({
        body: 'hi',
        actionUrl: 'javascript:alert(1)',
      }),
    });

    expect(
      renderContent(makeRow('test.unsafe-url', 1, {})).actionUrl,
    ).toBeNull();
  });

  it('rejects an unsafe href in a LIVE renderer segment (falls back to frozen)', () => {
    // A renderer emitting a `javascript:` link must NOT reach the client: the
    // segment schema rejects it, render throws, and we fall back to frozen.
    defineNotificationType({
      key: 'test.unsafe-segment',
      version: 1,
      paramsSchema: z.object({}),
      channels: ['inApp'],
      render: () => ({
        body: [{ type: 'link', value: 'click', href: 'javascript:alert(1)' }],
      }),
    });

    expect(
      renderContent(makeRow('test.unsafe-segment', 1, {})).segments,
    ).toEqual(FROZEN);
  });
});
