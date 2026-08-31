import { describe, expect, it } from 'vitest';

import type { ProjectDefinition } from '#src/schema/index.js';

import { getAppUrls } from './app-url-utils.js';

interface AppFixture {
  id: string;
  name: string;
  type: string;
  devPort: number;
  url?: string;
}

function buildDefinition(
  apps: AppFixture[],
  defaultWebAppRef?: string,
): ProjectDefinition {
  return {
    apps: apps.map((app) => ({ url: '', ...app })),
    settings: {
      general: { name: 'test', packageScope: '', portOffset: 5000 },
      ...(defaultWebAppRef ? { urls: { defaultWebAppRef } } : {}),
    },
  } as unknown as ProjectDefinition;
}

const BACKEND: AppFixture = {
  id: 'app:backend',
  name: 'backend',
  type: 'backend',
  devPort: 5001,
};
const ADMIN: AppFixture = {
  id: 'app:admin',
  name: 'admin',
  type: 'web',
  devPort: 5030,
};
const WEB: AppFixture = {
  id: 'app:app',
  name: 'app',
  type: 'web',
  devPort: 5031,
};

describe('getAppUrls', () => {
  it('derives every origin from dev ports when nothing is configured', () => {
    expect(getAppUrls(buildDefinition([ADMIN, WEB, BACKEND]))).toEqual({
      apiUrl: 'http://localhost:5001',
      webApps: [
        { name: 'admin', url: 'http://localhost:5030', isDefault: false },
        { name: 'app', url: 'http://localhost:5031', isDefault: true },
      ],
    });
  });

  it('defaults to the first web app that is not the admin console', () => {
    // Project order puts admin first, so a naive "first web app" would pick it.
    const { webApps } = getAppUrls(buildDefinition([ADMIN, WEB, BACKEND]));

    expect(webApps.find((app) => app.isDefault)?.name).toBe('app');
  });

  it('honours an explicitly configured default web app', () => {
    const { webApps } = getAppUrls(
      buildDefinition([ADMIN, WEB, BACKEND], 'app:admin'),
    );

    expect(webApps.find((app) => app.isDefault)?.name).toBe('admin');
  });

  it('falls back to the admin console when it is the only web app', () => {
    const { webApps } = getAppUrls(buildDefinition([ADMIN, BACKEND]));

    expect(webApps).toEqual([
      { name: 'admin', url: 'http://localhost:5030', isDefault: true },
    ]);
  });

  it('prefers a configured url over the dev port, without its trailing slash', () => {
    const definition = buildDefinition([
      { ...WEB, url: 'https://app.example.com/' },
      { ...BACKEND, url: 'https://api.example.com' },
    ]);

    expect(getAppUrls(definition)).toEqual({
      apiUrl: 'https://api.example.com',
      webApps: [
        { name: 'app', url: 'https://app.example.com', isDefault: true },
      ],
    });
  });

  it('falls back to the backend itself when the project has no web apps', () => {
    // Consumers index a record by app name, so an empty list would leave them
    // with no origin to default to.
    expect(getAppUrls(buildDefinition([BACKEND]))).toEqual({
      apiUrl: 'http://localhost:5001',
      webApps: [
        { name: 'backend', url: 'http://localhost:5001', isDefault: true },
      ],
    });
  });
});
