import { describe, expect, it } from 'vitest';

import { migration020MoveRedisToInfrastructure } from './migration-020-move-redis-to-infrastructure.js';

describe('migration020MoveRedisToInfrastructure', () => {
  it('moves enableRedis from backend app to infrastructure settings', () => {
    const oldConfig = {
      apps: [
        {
          id: 'backend-1',
          type: 'backend',
          name: 'Backend',
          enableRedis: true,
        },
      ],
      settings: {
        general: {
          name: 'test-project',
          packageScope: '',
          portOffset: 3000,
        },
      },
    };

    const result = migration020MoveRedisToInfrastructure.migrate(oldConfig);

    expect(result.settings?.infrastructure?.redis?.enabled).toBe(true);
    expect(result.apps?.[0]).toEqual({
      id: 'backend-1',
      type: 'backend',
      name: 'Backend',
    });
  });

  it('handles enableRedis set to false', () => {
    const oldConfig = {
      apps: [
        {
          id: 'backend-1',
          type: 'backend',
          name: 'Backend',
          enableRedis: false,
        },
      ],
      settings: {
        general: {
          name: 'test-project',
        },
      },
    };

    const result = migration020MoveRedisToInfrastructure.migrate(oldConfig);

    expect(result.settings?.infrastructure?.redis?.enabled).toBe(false);
  });

  it('defaults to false when no backend app has enableRedis', () => {
    const oldConfig = {
      apps: [
        {
          id: 'web-1',
          type: 'web',
          name: 'Web App',
        },
      ],
      settings: {
        general: {
          name: 'test-project',
        },
      },
    };

    const result = migration020MoveRedisToInfrastructure.migrate(oldConfig);

    expect(result.settings?.infrastructure?.redis?.enabled).toBe(false);
  });

  it('uses the first backend app when multiple backends exist', () => {
    const oldConfig = {
      apps: [
        {
          id: 'backend-1',
          type: 'backend',
          name: 'Backend 1',
          enableRedis: true,
        },
        {
          id: 'backend-2',
          type: 'backend',
          name: 'Backend 2',
          enableRedis: false,
        },
      ],
      settings: {},
    };

    const result = migration020MoveRedisToInfrastructure.migrate(oldConfig);

    expect(result.settings?.infrastructure?.redis?.enabled).toBe(true);
    expect(result.apps?.[0]).not.toHaveProperty('enableRedis');
    expect(result.apps?.[1]).not.toHaveProperty('enableRedis');
  });

  it('preserves other backend app properties', () => {
    const oldConfig = {
      apps: [
        {
          id: 'backend-1',
          type: 'backend',
          name: 'Backend',
          enableRedis: true,
          enableAxios: true,
          enableStripe: false,
        },
      ],
      settings: {},
    };

    const result = migration020MoveRedisToInfrastructure.migrate(oldConfig);

    expect(result.apps?.[0]).toEqual({
      id: 'backend-1',
      type: 'backend',
      name: 'Backend',
      enableAxios: true,
      enableStripe: false,
    });
  });

  it('preserves existing infrastructure settings', () => {
    const oldConfig = {
      apps: [
        {
          id: 'backend-1',
          type: 'backend',
          name: 'Backend',
          enableRedis: true,
        },
      ],
      settings: {
        infrastructure: {
          otherSetting: 'value',
        },
      },
    };

    const result = migration020MoveRedisToInfrastructure.migrate(oldConfig);

    expect(result.settings?.infrastructure).toEqual({
      otherSetting: 'value',
      redis: {
        enabled: true,
      },
    });
  });

  it('handles missing apps array', () => {
    const oldConfig = {
      settings: {
        general: {
          name: 'test-project',
        },
      },
    };

    const result = migration020MoveRedisToInfrastructure.migrate(oldConfig);

    expect(result.settings?.infrastructure?.redis?.enabled).toBe(false);
  });

  it('handles empty apps array', () => {
    const oldConfig = {
      apps: [],
      settings: {},
    };

    const result = migration020MoveRedisToInfrastructure.migrate(oldConfig);

    expect(result.settings?.infrastructure?.redis?.enabled).toBe(false);
    expect(result.apps).toEqual([]);
  });

  it('preserves non-backend apps unchanged', () => {
    const oldConfig = {
      apps: [
        {
          id: 'web-1',
          type: 'web',
          name: 'Web App',
          customProp: 'value',
        },
        {
          id: 'backend-1',
          type: 'backend',
          name: 'Backend',
          enableRedis: true,
        },
      ],
      settings: {},
    };

    const result = migration020MoveRedisToInfrastructure.migrate(oldConfig);

    expect(result.apps?.[0]).toEqual({
      id: 'web-1',
      type: 'web',
      name: 'Web App',
      customProp: 'value',
    });
  });

  it('preserves other settings properties', () => {
    const oldConfig = {
      apps: [
        {
          id: 'backend-1',
          type: 'backend',
          name: 'Backend',
          enableRedis: true,
        },
      ],
      settings: {
        general: {
          name: 'test-project',
        },
        theme: {
          primaryColor: 'blue',
        },
        templateExtractor: {
          enabled: true,
        },
      },
    };

    const result = migration020MoveRedisToInfrastructure.migrate(oldConfig);

    expect(result.settings?.general).toEqual({
      name: 'test-project',
    });
    expect(result.settings?.theme).toEqual({
      primaryColor: 'blue',
    });
    expect(result.settings?.templateExtractor).toEqual({
      enabled: true,
    });
  });

  it('preserves other root-level properties', () => {
    const oldConfig = {
      apps: [
        {
          id: 'backend-1',
          type: 'backend',
          name: 'Backend',
          enableRedis: true,
        },
      ],
      models: [{ id: 'model-1', name: 'User' }],
      features: [{ id: 'feature-1', name: 'Auth' }],
      settings: {},
    };

    const result = migration020MoveRedisToInfrastructure.migrate(oldConfig);

    expect((result as { models?: unknown }).models).toEqual([
      { id: 'model-1', name: 'User' },
    ]);
    expect((result as { features?: unknown }).features).toEqual([
      { id: 'feature-1', name: 'Auth' },
    ]);
  });
});
