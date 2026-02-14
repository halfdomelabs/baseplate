import { compareStrings } from '@baseplate-dev/utils';

import { createSchemaMigration } from './types.js';

interface AppConfig {
  id: string;
  name: string;
  type: 'backend' | 'web';
  port?: number;
  [key: string]: unknown;
}

interface Settings {
  general: {
    portOffset: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface OldConfig {
  apps?: AppConfig[];
  settings: Settings;
  [key: string]: unknown;
}

interface NewConfig {
  apps?: AppConfig[];
  settings: Settings;
  [key: string]: unknown;
}

/**
 * Migration to assign ports to apps
 *
 * This migration assigns ports to all existing apps based on their type:
 * - Backend apps: portOffset + 1
 * - Web apps: portOffset + 30 + alphabeticalIndex
 */
export const migration023AssignAppPorts = createSchemaMigration<
  OldConfig,
  NewConfig
>({
  version: 23,
  name: 'assignAppPorts',
  description: 'Assign development ports to all apps',
  migrate: (config) => {
    if (!config.apps) {
      return config;
    }

    const { portOffset } = config.settings.general;

    // Sort web apps alphabetically to assign ports deterministically
    const webApps = config.apps
      .filter((app) => app.type === 'web')
      .toSorted((a, b) => compareStrings(a.name, b.name));

    const updatedApps = config.apps.map((app) => {
      // Skip if port already assigned
      if (app.port !== undefined) {
        return app;
      }

      // Assign port based on app type
      switch (app.type) {
        case 'backend': {
          return { ...app, port: portOffset + 1 };
        }
        case 'web': {
          const webAppIndex = webApps.findIndex(
            (webApp) => webApp.id === app.id,
          );
          return { ...app, port: portOffset + 30 + webAppIndex };
        }
        default: {
          // Other app types don't get ports
          return app;
        }
      }
    });

    return {
      ...config,
      apps: updatedApps,
    };
  },
});
