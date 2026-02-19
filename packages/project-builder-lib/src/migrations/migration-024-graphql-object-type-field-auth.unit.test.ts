import { describe, expect, it } from 'vitest';

import { migration024GraphqlObjectTypeFieldAuth } from './migration-024-graphql-object-type-field-auth.js';

describe('migration024GraphqlObjectTypeFieldAuth', () => {
  it('converts string field refs to object entries', () => {
    const config = {
      models: [
        {
          name: 'User',
          graphql: {
            objectType: {
              enabled: true,
              fields: ['field-1', 'field-2'],
              localRelations: ['rel-1'],
              foreignRelations: ['frel-1', 'frel-2'],
            },
          },
        },
      ],
    };

    const result = migration024GraphqlObjectTypeFieldAuth.migrate(config);

    expect(result.models?.[0].graphql?.objectType?.fields).toEqual([
      { ref: 'field-1', roles: [], instanceRoles: [] },
      { ref: 'field-2', roles: [], instanceRoles: [] },
    ]);
    expect(result.models?.[0].graphql?.objectType?.localRelations).toEqual([
      { ref: 'rel-1', roles: [], instanceRoles: [] },
    ]);
    expect(result.models?.[0].graphql?.objectType?.foreignRelations).toEqual([
      { ref: 'frel-1', roles: [], instanceRoles: [] },
      { ref: 'frel-2', roles: [], instanceRoles: [] },
    ]);
  });

  it('handles models without graphql config', () => {
    const config = {
      models: [
        {
          name: 'User',
        },
      ],
    };

    const result = migration024GraphqlObjectTypeFieldAuth.migrate(config);

    expect(result.models?.[0]).toEqual({ name: 'User' });
  });

  it('handles models without objectType', () => {
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

    const result = migration024GraphqlObjectTypeFieldAuth.migrate(config);

    expect(result.models?.[0].graphql?.objectType).toBeUndefined();
  });

  it('handles empty field arrays', () => {
    const config = {
      models: [
        {
          name: 'User',
          graphql: {
            objectType: {
              enabled: true,
              fields: [],
              localRelations: [],
              foreignRelations: [],
            },
          },
        },
      ],
    };

    const result = migration024GraphqlObjectTypeFieldAuth.migrate(config);

    expect(result.models?.[0].graphql?.objectType?.fields).toEqual([]);
    expect(result.models?.[0].graphql?.objectType?.localRelations).toEqual([]);
    expect(result.models?.[0].graphql?.objectType?.foreignRelations).toEqual(
      [],
    );
  });

  it('handles missing models array', () => {
    const config = {
      settings: { general: {} },
    };

    const result = migration024GraphqlObjectTypeFieldAuth.migrate(config);

    expect(result).toEqual(config);
  });

  it('preserves objectType enabled flag', () => {
    const config = {
      models: [
        {
          name: 'User',
          graphql: {
            objectType: {
              enabled: true,
              fields: ['field-1'],
            },
          },
        },
      ],
    };

    const result = migration024GraphqlObjectTypeFieldAuth.migrate(config);

    expect(result.models?.[0].graphql?.objectType?.enabled).toBe(true);
  });

  it('preserves other model properties', () => {
    const config = {
      models: [
        {
          name: 'User',
          featureRef: 'feature-1',
          model: { fields: [] },
          graphql: {
            objectType: {
              enabled: true,
              fields: ['field-1'],
            },
            queries: { get: { enabled: true } },
          },
        },
      ],
    };

    const result = migration024GraphqlObjectTypeFieldAuth.migrate(config);

    expect(result.models?.[0].name).toBe('User');
    expect(result.models?.[0].featureRef).toBe('feature-1');
    expect(result.models?.[0].graphql?.queries).toEqual({
      get: { enabled: true },
    });
  });

  it('handles already-migrated data gracefully', () => {
    const config = {
      models: [
        {
          name: 'User',
          graphql: {
            objectType: {
              enabled: true,
              fields: [
                { ref: 'field-1', roles: ['role-1'], instanceRoles: [] },
              ],
            },
          },
        },
      ],
    };

    const result = migration024GraphqlObjectTypeFieldAuth.migrate(config);

    // Should preserve existing object entries
    expect(result.models?.[0].graphql?.objectType?.fields).toEqual([
      { ref: 'field-1', roles: ['role-1'], instanceRoles: [] },
    ]);
  });

  it('handles multiple models', () => {
    const config = {
      models: [
        {
          name: 'User',
          graphql: {
            objectType: {
              enabled: true,
              fields: ['field-1'],
            },
          },
        },
        {
          name: 'Post',
          graphql: {
            objectType: {
              enabled: true,
              fields: ['field-2', 'field-3'],
              localRelations: ['rel-1'],
            },
          },
        },
      ],
    };

    const result = migration024GraphqlObjectTypeFieldAuth.migrate(config);

    expect(result.models?.[0].graphql?.objectType?.fields).toEqual([
      { ref: 'field-1', roles: [], instanceRoles: [] },
    ]);
    expect(result.models?.[1].graphql?.objectType?.fields).toEqual([
      { ref: 'field-2', roles: [], instanceRoles: [] },
      { ref: 'field-3', roles: [], instanceRoles: [] },
    ]);
    expect(result.models?.[1].graphql?.objectType?.localRelations).toEqual([
      { ref: 'rel-1', roles: [], instanceRoles: [] },
    ]);
  });
});
