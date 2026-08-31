import type { ProjectDefinition, WebAppConfig } from '#src/schema/index.js';

import { AppUtils } from './app-utils.js';

/** A web app's public origin, and whether it is the app the backend links to. */
export interface WebAppUrl {
  name: string;
  url: string;
  isDefault: boolean;
}

/** The origins an app serves itself and its clients from. */
export interface AppUrls {
  /** The backend's public origin. */
  apiUrl: string;
  /**
   * Every web app's origin, in project order. A project with no web apps
   * yields a single entry naming the backend.
   */
  webApps: WebAppUrl[];
}

/** Conventional name of the admin console, which is never the default client. */
const ADMIN_APP_NAME = 'admin';

/**
 * An app's origin, falling back to its dev server when none is configured.
 *
 * @param app - The app to resolve
 * @returns The configured URL, or `http://localhost:{devPort}`
 */
function resolveAppUrl(app: { url: string; devPort?: number }): string {
  if (app.url !== '') return app.url.replace(/\/+$/, '');
  return `http://localhost:${String(app.devPort)}`;
}

/**
 * Picks the web app the backend links to when no client is in scope.
 *
 * @param webApps - The project's web apps
 * @param defaultWebAppId - The explicitly configured default, if any
 * @returns The default web app, or undefined if the project has no web apps
 */
function pickDefaultWebApp(
  webApps: WebAppConfig[],
  defaultWebAppId: string | undefined,
): WebAppConfig | undefined {
  const configured = webApps.find((app) => app.id === defaultWebAppId);
  if (configured) return configured;
  return (
    webApps.find((app) => app.name !== ADMIN_APP_NAME) ??
    // An admin-only project still needs somewhere to send its links.
    webApps[0]
  );
}

/**
 * Resolves the public origins of a project's apps.
 *
 * @param projectDefinition - The project definition to read apps and settings from
 * @returns The backend origin and every web app origin
 */
export function getAppUrls(projectDefinition: ProjectDefinition): AppUrls {
  const backendApp = AppUtils.getBackendApp(projectDefinition);
  const apiUrl = resolveAppUrl(backendApp);
  const webApps = projectDefinition.apps.filter(
    (app): app is WebAppConfig => app.type === 'web',
  );

  if (webApps.length === 0) {
    return {
      apiUrl,
      webApps: [{ name: backendApp.name, url: apiUrl, isDefault: true }],
    };
  }

  const defaultWebApp = pickDefaultWebApp(
    webApps,
    projectDefinition.settings.urls?.defaultWebAppRef,
  );

  return {
    apiUrl,
    webApps: webApps.map((app) => ({
      name: app.name,
      url: resolveAppUrl(app),
      isDefault: app.id === defaultWebApp?.id,
    })),
  };
}
