import { describe, expect, it } from 'vitest';

import { migration026QuerySharedRoles } from './migration-026-query-shared-roles.js';

describe('migration026QuerySharedRoles', () => {
  it('merges get.roles and list.roles into shared globalRoles', () => {
    const config = {
      models: [
        {
          name: 'TodoList',
          graphql: {
            queries: {
              get: { enabled: true, roles: ['role-user'] },
              list: { enabled: true, roles: ['role-user', 'role-admin'] },
            },
          },
        },
      ],
    };

    const result = migration026QuerySharedRoles.migrate(config);

    expect(result.models?.[0].graphql?.queries).toEqual({
      globalRoles: ['role-user', 'role-admin'],
      instanceRoles: [],
      get: { enabled: true },
      list: { enabled: true, count: {} },
    });
  });

  it('deduplicates roles from get and list', () => {
    const config = {
      models: [
        {
          name: 'User',
          graphql: {
            queries: {
              get: { enabled: true, roles: ['role-admin', 'role-user'] },
              list: { enabled: true, roles: ['role-user', 'role-admin'] },
            },
          },
        },
      ],
    };

    const result = migration026QuerySharedRoles.migrate(config);

    expect(result.models?.[0].graphql?.queries?.globalRoles).toEqual([
      'role-admin',
      'role-user',
    ]);
  });

  it('handles empty roles arrays', () => {
    const config = {
      models: [
        {
          name: 'User',
          graphql: {
            queries: {
              get: { enabled: true, roles: [] },
              list: { enabled: true, roles: [] },
            },
          },
        },
      ],
    };

    const result = migration026QuerySharedRoles.migrate(config);

    expect(result.models?.[0].graphql?.queries?.globalRoles).toEqual([]);
    expect(result.models?.[0].graphql?.queries?.instanceRoles).toEqual([]);
  });

  it('handles missing roles fields', () => {
    const config = {
      models: [
        {
          name: 'User',
          graphql: {
            queries: {
              get: { enabled: true },
              list: { enabled: true },
            },
          },
        },
      ],
    };

    const result = migration026QuerySharedRoles.migrate(config);

    expect(result.models?.[0].graphql?.queries?.globalRoles).toEqual([]);
  });

  it('preserves count config', () => {
    const config = {
      models: [
        {
          name: 'User',
          graphql: {
            queries: {
              get: { enabled: true, roles: ['role-user'] },
              list: {
                enabled: true,
                roles: ['role-user'],
                count: { enabled: true },
              },
            },
          },
        },
      ],
    };

    const result = migration026QuerySharedRoles.migrate(config);

    expect(result.models?.[0].graphql?.queries?.list).toEqual({
      enabled: true,
      count: { enabled: true },
    });
  });

  it('handles models without graphql config', () => {
    const config = {
      models: [{ name: 'User' }],
    };

    const result = migration026QuerySharedRoles.migrate(config);

    expect(result.models?.[0]).toEqual({ name: 'User' });
  });

  it('handles models without queries config', () => {
    const config = {
      models: [
        {
          name: 'User',
          graphql: {
            mutations: { create: { enabled: true } },
          },
        },
      ],
    };

    const result = migration026QuerySharedRoles.migrate(config);

    expect(result.models?.[0]).toEqual({
      name: 'User',
      graphql: {
        mutations: { create: { enabled: true } },
      },
    });
  });

  it('handles missing models array', () => {
    const config = {
      settings: { general: {} },
    };

    const result = migration026QuerySharedRoles.migrate(config);

    expect(result).toEqual(config);
  });

  it('preserves other graphql config', () => {
    const config = {
      models: [
        {
          name: 'User',
          graphql: {
            objectType: { enabled: true, fields: [] },
            queries: {
              get: { enabled: true, roles: ['role-user'] },
              list: { enabled: false, roles: [] },
            },
            mutations: { create: { enabled: true } },
          },
        },
      ],
    };

    const result = migration026QuerySharedRoles.migrate(config);

    expect(result.models?.[0].graphql?.objectType).toEqual({
      enabled: true,
      fields: [],
    });
    expect(result.models?.[0].graphql?.mutations).toEqual({
      create: { enabled: true },
    });
  });

  it('handles multiple models', () => {
    const config = {
      models: [
        {
          name: 'User',
          graphql: {
            queries: {
              get: { enabled: true, roles: ['role-admin'] },
              list: { enabled: true, roles: ['role-admin'] },
            },
          },
        },
        {
          name: 'Post',
          graphql: {
            queries: {
              get: { enabled: true, roles: ['role-user'] },
              list: { enabled: true, roles: ['role-user', 'role-admin'] },
            },
          },
        },
      ],
    };

    const result = migration026QuerySharedRoles.migrate(config);

    expect(result.models?.[0].graphql?.queries?.globalRoles).toEqual([
      'role-admin',
    ]);
    expect(result.models?.[1].graphql?.queries?.globalRoles).toEqual([
      'role-user',
      'role-admin',
    ]);
  });
});
