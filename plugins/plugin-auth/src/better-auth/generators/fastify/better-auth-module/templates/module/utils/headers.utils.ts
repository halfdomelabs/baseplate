// @ts-nocheck

import type { FastifyRequest } from 'fastify';

/**
 * Converts Fastify request headers to a Web API Headers object.
 */
export function toWebHeaders(headers: FastifyRequest['headers']): Headers {
  const webHeaders = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const v of value) {
        webHeaders.append(key, v);
      }
    } else {
      webHeaders.append(key, value);
    }
  }
  return webHeaders;
}
