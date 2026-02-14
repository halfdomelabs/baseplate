import { compareStrings } from '@baseplate-dev/utils';

import { createSchemaMigration } from './types.js';

interface AppConfig {
  id: string;
  name: string;
  type: 'backend' | 'web';
  devPort?: number;
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
 * Migration to assign development ports to apps
 *
 * This migration assigns devPort to all existing apps based on their type:
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
      // Skip if devPort already assigned
      if (app.devPort !== undefined) {
        return app;
      }

      // Assign devPort based on app type
      switch (app.type) {
        case 'backend': {
          return { ...app, devPort: portOffset + 1 };
        }
        case 'web': {
          const webAppIndex = webApps.findIndex(
            (webApp) => webApp.id === app.id,
          );
          return { ...app, devPort: portOffset + 30 + webAppIndex };
        }
        default: {
          // Other app types don't get devPort
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
