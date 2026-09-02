import fp from 'fastify-plugin';

import type { AppServices } from '@src/utils/runtime-services.js';

import {
  applyUnsubscribeLink,
  parseUnsubscribeLink,
  UNSUBSCRIBE_PATH,
  UNSUBSCRIBE_TOKEN_PARAM,
} from '../services/notification-unsubscribe.js';

/** The `t` parameter carrying the link's token. */
interface UnsubscribeQuery {
  [UNSUBSCRIBE_TOKEN_PARAM]?: string | string[];
}

/** Fastify hands back an array if the parameter is repeated; take the first. */
function readToken(query: UnsubscribeQuery): string | undefined {
  const value = query[UNSUBSCRIBE_TOKEN_PARAM];
  return Array.isArray(value) ? value[0] : value;
}

/**
 * The unsubscribe endpoint behind `List-Unsubscribe`.
 *
 * Unauthenticated by design — RFC 8058 forbids the one-click POST from carrying
 * cookies or authorization at all, so the signed token is its only authority.
 * Every verified token gets the same response, whatever the stored state.
 */
export const notificationUnsubscribePlugin = fp<{
  services: Pick<AppServices, 'notification'>;
}>(
  (fastify, { services }, done) => {
    // RFC 8058 §3.2 has receivers send the one-click POST as multipart/form-data
    // or application/x-www-form-urlencoded, and Fastify answers 415 for both by
    // default. The token is in the query string, so every content type is
    // accepted and its body discarded unread — bounded, since nothing legitimate
    // sends more than `List-Unsubscribe=One-Click` plus multipart framing.
    fastify.addContentTypeParser(
      '*',
      { parseAs: 'string', bodyLimit: 4096 },
      (_request, _body, next) => {
        next(null, undefined);
      },
    );

    // Declared only so the path answers 405 rather than 404. It must not
    // unsubscribe: mail clients prefetch links.
    fastify.get(UNSUBSCRIBE_PATH, async (_request, reply) => {
      await reply
        .header('Allow', 'POST')
        .type('text/plain; charset=utf-8')
        .status(405)
        .send('Unsubscribe requires a POST request.');
    });

    fastify.post<{ Querystring: UnsubscribeQuery }>(
      UNSUBSCRIBE_PATH,
      async (request, reply) => {
        const link = parseUnsubscribeLink(readToken(request.query));
        if (link) await applyUnsubscribeLink(services.notification, link);

        await reply
          .type('text/plain; charset=utf-8')
          .status(link ? 200 : 400)
          .send(link ? 'Unsubscribed' : 'Invalid link');
      },
    );

    done();
  },
  { name: 'notification-unsubscribe', encapsulate: true },
);
