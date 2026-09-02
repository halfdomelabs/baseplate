import type { FastifyInstance } from 'fastify';

import fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { NotificationService } from '../services/notification.service.js';

import { buildUnsubscribeUrl } from '../services/notification-unsubscribe.js';
import { notificationUnsubscribePlugin } from './notification-unsubscribe.plugin.js';

vi.mock('@src/services/config.js', () => ({
  getConfig: () => ({
    APP_SECRET: 'test-secret-with-at-least-32-characters',
    APP_SECRET_PREVIOUS: '',
    API_URL: 'https://api.example.com',
  }),
}));

vi.mock('@src/services/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: ({ where }: { where: { id: string } }) =>
        Promise.resolve({ id: where.id }),
    },
  },
}));

const setPreference = vi.fn(() => Promise.resolve());

/** Path plus query, as the mail carries it. */
function unsubscribeTarget(topicKeys: ('general' | 'postLikes')[]): string {
  const url = buildUnsubscribeUrl('user-1', topicKeys) ?? '';
  const { pathname, search } = new URL(url);
  return `${pathname}${search}`;
}

async function buildApp(): Promise<FastifyInstance> {
  const app = fastify();
  await app.register(notificationUnsubscribePlugin, {
    services: {
      notification: { setPreference } as unknown as NotificationService,
    },
  });
  return app;
}

beforeEach(() => {
  setPreference.mockClear();
});

describe('unsubscribe endpoint', () => {
  it('refuses GET with 405 and writes nothing', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'GET',
      url: unsubscribeTarget(['general']),
    });

    // 405 so the path does not read as broken, and no write because mail
    // clients prefetch links.
    expect(response.statusCode).toBe(405);
    expect(response.headers.allow).toBe('POST');
    expect(setPreference).not.toHaveBeenCalled();
  });

  it('accepts the RFC 8058 one-click POST', async () => {
    const app = await buildApp();

    // The exact request a mail provider sends. Without the route's own parser
    // Fastify answers 415.
    const response = await app.inject({
      method: 'POST',
      url: unsubscribeTarget(['general']),
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      payload: 'List-Unsubscribe=One-Click',
    });

    expect(response.statusCode).toBe(200);
    expect(setPreference).toHaveBeenCalledWith('user-1', {
      topicKey: 'general',
      channel: 'email',
      mode: 'off',
    });
  });

  it('accepts the one-click POST as multipart/form-data', async () => {
    const app = await buildApp();

    // RFC 8058 §3.2 makes multipart the SHOULD and urlencoded only a MAY, so
    // this is the encoding a compliant receiver is most likely to send.
    const response = await app.inject({
      method: 'POST',
      url: unsubscribeTarget(['general']),
      headers: {
        'content-type': 'multipart/form-data; boundary=--------boundary',
      },
      payload: [
        '----------boundary',
        'Content-Disposition: form-data; name="List-Unsubscribe"',
        '',
        'One-Click',
        '----------boundary--',
        '',
      ].join('\r\n'),
    });

    expect(response.statusCode).toBe(200);
    expect(setPreference).toHaveBeenCalledWith('user-1', {
      topicKey: 'general',
      channel: 'email',
      mode: 'off',
    });
  });

  it('accepts a one-click POST carrying no body at all', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'POST',
      url: unsubscribeTarget(['general']),
    });

    expect(response.statusCode).toBe(200);
  });

  it('answers in plain text, which is all a provider reads', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'POST',
      url: unsubscribeTarget(['general']),
    });

    expect(response.headers['content-type']).toContain('text/plain');
    expect(response.body).toBe('Unsubscribed');
  });

  it('answers a repeat POST exactly as the first', async () => {
    const app = await buildApp();
    const url = unsubscribeTarget(['general']);

    const first = await app.inject({ method: 'POST', url });
    const second = await app.inject({ method: 'POST', url });

    // Already-off must be indistinguishable from freshly-off.
    expect(second.statusCode).toBe(first.statusCode);
    expect(second.body).toBe(first.body);
  });

  it('writes one row per topic a digest link covers', async () => {
    const app = await buildApp();

    await app.inject({
      method: 'POST',
      url: unsubscribeTarget(['general', 'postLikes']),
    });

    expect(setPreference).toHaveBeenCalledTimes(2);
  });

  it('rejects a link whose token does not verify', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/notifications/unsubscribe?t=general.forged.token.here',
    });

    expect(response.statusCode).toBe(400);
    expect(setPreference).not.toHaveBeenCalled();
  });
});
