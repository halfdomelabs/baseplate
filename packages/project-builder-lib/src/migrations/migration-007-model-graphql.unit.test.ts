import { describe, expect, it } from 'vitest';

import { migration007ModelGraphql } from './migration-007-model-graphql.js';

describe('migration007ModelGraphql', () => {
  it('migrates model schema to new graphql format', () => {
    const oldConfig = {
      schemaVersion: 1,
      models: [
        {
          id: 'model-id',
          schema: {
            buildObjectType: true,
            exposedFields: ['field1', 'field2'],
            exposedLocalRelations: ['relation1'],
            exposedForeignRelations: ['relation2'],
            buildQuery: true,
            buildMutations: true,
            authorize: {
              read: ['role1'],
              create: ['role2'],
              update: ['role3'],
              delete: ['role4'],
            },
          },
        },
      ],
    };

    const expectedNewConfig = {
      schemaVersion: 1,
      models: [
        {
          id: 'model-id',
          graphql: {
            objectType: {
              enabled: true,
              fields: ['field1', 'field2'],
              localRelations: ['relation1'],
              foreignRelations: ['relation2'],
            },
            queries: {
              get: {
                enabled: true,
                roles: ['role1'],
              },
              list: {
                enabled: true,
                roles: ['role1'],
              },
            },
            mutations: {
              create: {
                enabled: true,
                roles: ['role2'],
              },
              update: {
                enabled: true,
                roles: ['role3'],
              },
              delete: {
                enabled: true,
                roles: ['role4'],
              },
            },
          },
        },
      ],
    };

    const migratedConfig = migration007ModelGraphql.migrate(oldConfig);
    expect(migratedConfig).toEqual(expectedNewConfig);
  });

  it('handles missing schema fields gracefully', () => {
    const oldConfig = {
      models: [
        {
          id: 'model-id',
          schema: {
            buildObjectType: true,
          },
        },
      ],
    };

    const expectedNewConfig = {
      models: [
        {
          id: 'model-id',
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

    const migratedConfig = migration007ModelGraphql.migrate(oldConfig);
    expect(migratedConfig).toEqual(expectedNewConfig);
  });

  it('removes graphql field if buildObjectType is false', () => {
    const oldConfig = {
      models: [
        {
          id: 'model-id',
          schema: {
            buildObjectType: false,
            exposedFields: ['field1'],
          },
        },
      ],
    };

    const expectedNewConfig = {
      models: [
        {
          id: 'model-id',
        },
      ],
    };

    const migratedConfig = migration007ModelGraphql.migrate(oldConfig);
    expect(migratedConfig).toEqual(expectedNewConfig);
  });

  it('removes mutations if no authorization roles', () => {
    const oldConfig = {
      models: [
        {
          id: 'model-id',
          schema: {
            buildObjectType: true,
            buildMutations: true,
            authorize: {
              read: [],
              create: [],
              update: [],
              delete: [],
            },
          },
        },
      ],
    };

    const expectedNewConfig = {
      models: [
        {
          id: 'model-id',
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

    const migratedConfig = migration007ModelGraphql.migrate(oldConfig);
    expect(migratedConfig).toEqual(expectedNewConfig);
  });

  it('handles empty or missing schema field gracefully', () => {
    const oldConfig = {
      models: [
        {
          id: 'model-id',
        },
      ],
    };

    const expectedNewConfig = {
      models: [
        {
          id: 'model-id',
        },
      ],
    };

    const migratedConfig = migration007ModelGraphql.migrate(oldConfig);
    expect(migratedConfig).toEqual(expectedNewConfig);
  });
});
