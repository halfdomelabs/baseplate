import { describe, expect, it } from 'vitest';

import { migration025ServiceMethodAuth } from './migration-025-service-method-auth.js';

describe('migration025ServiceMethodAuth', () => {
  it('moves mutation roles to service globalRoles', () => {
    const config = {
      models: [
        {
          name: 'User',
          service: {
            create: { enabled: true, fields: ['f1'] },
            update: { enabled: true, fields: ['f1'] },
            delete: { enabled: true },
          },
          graphql: {
            mutations: {
              create: { enabled: true, roles: ['role-admin'] },
              update: { enabled: true, roles: ['role-admin', 'role-user'] },
              delete: { enabled: true, roles: ['role-admin'] },
            },
          },
        },
      ],
    };

    const result = migration025ServiceMethodAuth.migrate(config);

    expect(result.models?.[0].service?.create?.globalRoles).toEqual([
      'role-admin',
    ]);
    expect(result.models?.[0].service?.update?.globalRoles).toEqual([
      'role-admin',
      'role-user',
    ]);
    expect(result.models?.[0].service?.delete?.globalRoles).toEqual([
      'role-admin',
    ]);
  });

  it('strips roles from graphql mutations', () => {
    const config = {
      models: [
        {
          name: 'User',
          graphql: {
            mutations: {
              create: { enabled: true, roles: ['role-admin'] },
              update: { enabled: false, roles: [] },
              delete: { enabled: true, roles: ['role-admin'] },
            },
          },
        },
      ],
    };

    const result = migration025ServiceMethodAuth.migrate(config);

    expect(result.models?.[0].graphql?.mutations).toEqual({
      create: { enabled: true },
      update: { enabled: false },
      delete: { enabled: true },
    });
  });

  it('handles empty roles arrays', () => {
    const config = {
      models: [
        {
          name: 'User',
          graphql: {
            mutations: {
              create: { enabled: true, roles: [] },
              update: { enabled: true, roles: [] },
              delete: { enabled: false, roles: [] },
            },
          },
        },
      ],
    };

    const result = migration025ServiceMethodAuth.migrate(config);

    expect(result.models?.[0].service?.create?.globalRoles).toEqual([]);
    expect(result.models?.[0].service?.update?.globalRoles).toEqual([]);
    expect(result.models?.[0].service?.delete?.globalRoles).toEqual([]);
  });

  it('handles models without graphql config', () => {
    const config = {
      models: [{ name: 'User' }],
    };

    const result = migration025ServiceMethodAuth.migrate(config);

    expect(result.models?.[0]).toEqual({ name: 'User' });
  });

  it('handles models without mutations', () => {
    const config = {
      models: [
        {
          name: 'User',
          graphql: {
            queries: { get: { enabled: true } },
          },
        },
      ],
    };

    const result = migration025ServiceMethodAuth.migrate(config);

    expect(result.models?.[0]).toEqual({
      name: 'User',
      graphql: {
        queries: { get: { enabled: true } },
      },
    });
  });

  it('handles missing models array', () => {
    const config = {
      settings: { general: {} },
    };

    const result = migration025ServiceMethodAuth.migrate(config);

    expect(result).toEqual(config);
  });

  it('preserves existing service config', () => {
    const config = {
      models: [
        {
          name: 'User',
          service: {
            create: { enabled: true, fields: ['f1', 'f2'] },
            update: { enabled: true, fields: ['f1'] },
            delete: { enabled: false },
            transformers: [{ type: 'test' }],
          },
          graphql: {
            mutations: {
              create: { enabled: true, roles: ['role-admin'] },
              update: { enabled: true, roles: [] },
              delete: { enabled: false, roles: [] },
            },
          },
        },
      ],
    };

    const result = migration025ServiceMethodAuth.migrate(config);

    expect(result.models?.[0].service?.create).toEqual({
      enabled: true,
      fields: ['f1', 'f2'],
      globalRoles: ['role-admin'],
    });
    expect(result.models?.[0].service?.transformers).toEqual([
      { type: 'test' },
    ]);
  });

  it('preserves other graphql config', () => {
    const config = {
      models: [
        {
          name: 'User',
          graphql: {
            objectType: { enabled: true, fields: [] },
            queries: { get: { enabled: true, roles: ['role-admin'] } },
            mutations: {
              create: { enabled: true, roles: ['role-admin'] },
              update: { enabled: false, roles: [] },
              delete: { enabled: false, roles: [] },
            },
          },
        },
      ],
    };

    const result = migration025ServiceMethodAuth.migrate(config);

    expect(result.models?.[0].graphql?.objectType).toEqual({
      enabled: true,
      fields: [],
    });
    expect(result.models?.[0].graphql?.queries).toEqual({
      get: { enabled: true, roles: ['role-admin'] },
    });
  });

  it('handles multiple models', () => {
    const config = {
      models: [
        {
          name: 'User',
          graphql: {
            mutations: {
              create: { enabled: true, roles: ['role-admin'] },
              update: { enabled: true, roles: [] },
              delete: { enabled: false, roles: [] },
            },
          },
        },
        {
          name: 'Post',
          graphql: {
            mutations: {
              create: { enabled: true, roles: ['role-user'] },
              update: { enabled: true, roles: ['role-user'] },
              delete: { enabled: true, roles: ['role-admin'] },
            },
          },
        },
      ],
    };

    const result = migration025ServiceMethodAuth.migrate(config);

    expect(result.models?.[0].service?.create?.globalRoles).toEqual([
      'role-admin',
    ]);
    expect(result.models?.[1].service?.create?.globalRoles).toEqual([
      'role-user',
    ]);
    expect(result.models?.[1].service?.delete?.globalRoles).toEqual([
      'role-admin',
    ]);
  });

  it('handles mutations without roles field', () => {
    const config = {
      models: [
        {
          name: 'User',
          graphql: {
            mutations: {
              create: { enabled: true },
              update: { enabled: false },
              delete: { enabled: false },
            },
          },
        },
      ],
    };

    const result = migration025ServiceMethodAuth.migrate(config);

    expect(result.models?.[0].service?.create?.globalRoles).toEqual([]);
    expect(result.models?.[0].service?.update?.globalRoles).toEqual([]);
    expect(result.models?.[0].service?.delete?.globalRoles).toEqual([]);
  });
});
