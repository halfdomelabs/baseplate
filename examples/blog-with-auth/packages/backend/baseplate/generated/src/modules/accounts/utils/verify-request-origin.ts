import type { FastifyRequest } from 'fastify';

// Adapted from https://github.com/pilcrowonpaper/oslo/blob/main/src/request/index.ts

// Helper function to normalize host from URL
function getNormalizedHost(url: string): string | null {
  try {
    return new URL(
      url.startsWith('http://') || url.startsWith('https://')
        ? url
        : `https://${url}`,
    ).host.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Verifies if the request's origin is within the allowed hosts.
 *
 * @param req - The Fastify request object.
 * @param allowedHosts - An array of allowed hostnames.
 * @returns A boolean indicating whether the request's origin is allowed.
 */
export function verifyRequestOrigin(
  req: FastifyRequest,
  allowedHosts: string[],
): boolean {
  const { origin } = req.headers;
  if (!origin) {
    return false;
  }
  const originHost = getNormalizedHost(origin);
  if (!originHost) {
    return false;
  }

  const normalizedAllowedHosts = allowedHosts
    .map((host) => getNormalizedHost(host))
    .filter(Boolean);

  return normalizedAllowedHosts.includes(originHost);
}
