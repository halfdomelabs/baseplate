// @ts-nocheck

import type { FastifyRequest } from 'fastify';

/**
 * Converts Fastify request headers to a Web API Headers object.
 */
export function toWebHeaders(headers: FastifyRequest['headers']): Headers {
  const webHeaders = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (value) webHeaders.append(key, value.toString());
  }
  return webHeaders;
}
