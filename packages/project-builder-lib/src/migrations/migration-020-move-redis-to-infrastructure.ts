import { createSchemaMigration } from './types.js';

interface OldBackendApp {
  id: string;
  type: string;
  name: string;
  enableRedis?: boolean;
  [key: string]: unknown;
}

interface NewBackendApp {
  id: string;
  type: string;
  name: string;
  [key: string]: unknown;
}

interface OldConfig {
  apps?: OldBackendApp[];
  settings?: {
    general?: unknown;
    templateExtractor?: unknown;
    theme?: unknown;
    infrastructure?: {
      redis?: {
        enabled?: boolean;
      };
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface NewConfig {
  apps?: NewBackendApp[];
  settings?: {
    general?: unknown;
    templateExtractor?: unknown;
    theme?: unknown;
    infrastructure?: {
      redis?: {
        enabled: boolean;
      };
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Migration to move enableRedis from backend apps to infrastructure settings
 *
 * This migration:
 * 1. Finds the first backend app with enableRedis property
 * 2. Moves that value to settings.infrastructure.redis.enabled
 * 3. Removes enableRedis from all backend apps
 */
export const migration020MoveRedisToInfrastructure = createSchemaMigration<
  OldConfig,
  NewConfig
>({
  version: 20,
  name: 'moveRedisToInfrastructure',
  description:
    'Move enableRedis from backend apps to settings.infrastructure.redis.enabled',
  migrate: (config) => {
    // Find the first backend app with enableRedis
    const firstBackendApp = config.apps?.find(
      (app) => app.type === 'backend' && 'enableRedis' in app,
    );

    // Get the enableRedis value (default to false if not found)
    const enableRedis = firstBackendApp?.enableRedis ?? false;

    // Remove enableRedis from all apps
    const apps = config.apps?.map((app) => {
      if (app.type === 'backend' && 'enableRedis' in app) {
        const { enableRedis: _enableRedis, ...rest } = app;
        return rest as NewBackendApp;
      }
      return app as NewBackendApp;
    });

    // Update settings with infrastructure.redis.enabled
    const settings = {
      ...config.settings,
      infrastructure: {
        ...config.settings?.infrastructure,
        redis: {
          enabled: enableRedis,
        },
      },
    };

    return {
      ...config,
      apps,
      settings,
    } as NewConfig;
  },
});
