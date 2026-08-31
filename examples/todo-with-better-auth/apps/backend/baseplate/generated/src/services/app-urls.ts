import { getConfig } from './config.js';

/** Names of the web clients this backend serves. */
export type WebAppName =
  /* TPL_WEB_APP_NAMES:START */ 'admin' | 'web'; /* TPL_WEB_APP_NAMES:END */

/** Joins an origin and a path without producing a double slash. */
function joinUrl(origin: string, path: string): string {
  if (path === '') return origin;
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Each web client's public origin, keyed by app name. */
function getWebAppOrigins(): Record<WebAppName, string> {
  const config = getConfig();
  return /* TPL_WEB_APP_ORIGINS:START */ {
    admin: config.WEB_URL_ADMIN,
    web: config.WEB_URL_WEB,
  }; /* TPL_WEB_APP_ORIGINS:END */
}

/**
 * An absolute URL on this backend's public origin.
 *
 * For routes a third party has to reach without a session, such as an
 * unsubscribe endpoint a mail provider posts to.
 *
 * @param path - Path to append, with or without a leading slash.
 * @returns The absolute URL.
 */
export function getApiUrl(path = ''): string {
  return joinUrl(getConfig().API_URL, path);
}

/**
 * An absolute URL on a web client's origin.
 *
 * @param app - Which web client the link belongs to.
 * @param path - Path to append, with or without a leading slash.
 * @returns The absolute URL.
 */
export function getWebUrl(app: WebAppName, path = ''): string {
  return joinUrl(getWebAppOrigins()[app], path);
}

/**
 * The web client that serves a URL, if any.
 *
 * Takes a bare origin (a request's `Origin` header) or a full URL, matching on
 * origin alone.
 *
 * @param url - Origin or URL to look up.
 * @returns The client's app name, or undefined if none serves it.
 */
export function getWebAppForUrl(
  url: string | undefined,
): WebAppName | undefined {
  if (url === undefined) return undefined;
  let origin: string;
  try {
    origin = new URL(url).origin;
  } catch {
    return undefined;
  }
  const entries = Object.entries(getWebAppOrigins()) as [WebAppName, string][];
  return entries.find(([, webUrl]) => webUrl === origin)?.[0];
}

/**
 * Every origin the app trusts: its own web clients, plus anything named in
 * `ADDITIONAL_WEB_ORIGINS`.
 *
 * @returns The trusted origins, de-duplicated.
 */
export function getWebOrigins(): string[] {
  const additional = getConfig()
    .ADDITIONAL_WEB_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return [
    ...new Set([...Object.values<string>(getWebAppOrigins()), ...additional]),
  ];
}
