// @ts-nocheck

import type { FastifyRequest } from 'fastify';

import { config } from '%configServiceImports';

const COOKIE_NAME = 'user-session';

/**
 * Retrieves the name of the session cookie based on the provided request.
 * If the application environment is not 'development', the cookie name will be prefixed with '__Host-'.
 * In development, the cookie name will be suffixed with the port number.
 *
 * @param req - The FastifyRequest object representing the incoming request.
 * @returns The name of the Iron session cookie.
 */
export function getUserSessionCookieName(
  headers: FastifyRequest['headers'],
): string {
  if (config.APP_ENVIRONMENT !== 'dev') {
    return `__Host-${COOKIE_NAME}`;
  }
  // in development, localhost does not support the __Host prefix and should be scoped to port
  // use origin/referer header to determine hostname because dev reverse proxies use origin/referer to signal the original host
  const { origin, referer } = headers;
  const originalHost = origin ?? referer;
  let port;
  try {
    if (!originalHost) {
      port = config.SERVER_PORT;
    } else {
      const url = new URL(originalHost);
      const parsedPort = Number.parseInt(url.port, 10);
      // Validate port is in valid range (1-65535)
      port =
        parsedPort > 0 && parsedPort < 65_536 ? parsedPort : config.SERVER_PORT;
    }
  } catch {
    port = config.SERVER_PORT;
  }
  return `${COOKIE_NAME}-${port}`;
}
