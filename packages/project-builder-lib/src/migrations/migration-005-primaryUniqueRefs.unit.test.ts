import { describe, expect, expectTypeOf, it } from 'vitest';

import { migration005PrimaryUniqueRefs } from './migration-005-primaryUniqueRefs.js';
import { ProjectDefinition } from '../schema/index.js';

describe('migration005PrimaryUniqueRefs', () => {
  it('migrates primaryKeys to primaryKeyFieldRefs and unique constraints to new format', () => {
    const oldConfig = {
      models: [
        {
          id: 'model-id',
          model: {
            primaryKeys: ['id', 'email'],
            fields: [{ name: 'id' }, { name: 'email' }, { name: 'username' }],
            uniqueConstraints: [
              {
                name: 'unique_email',
                fields: [{ name: 'email' }],
              },
            ],
          },
        },
      ],
    };

    const expectedNewConfig = {
      models: [
        {
          id: 'model-id',
          model: {
            primaryKeyFieldRefs: ['id', 'email'],
            fields: [{ name: 'id' }, { name: 'email' }, { name: 'username' }],
            uniqueConstraints: [
              {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                id: expect.any(String),
                fields: [{ fieldRef: 'email' }],
              },
            ],
          },
        },
      ],
    };

    const migratedConfig = migration005PrimaryUniqueRefs.migrate(oldConfig);
    expect(migratedConfig).toEqual(expectedNewConfig);

    // simple type test to make sure the destination type matches ProjectDefinition (can remove once migrations are done)
    expectTypeOf(migratedConfig).toMatchTypeOf<ProjectDefinition>();
  });

  it('migrates single primary key / unique constraints', () => {
    const oldConfig = {
      models: [
        {
          id: 'model-id',
          model: {
            fields: [
              { name: 'id', isId: true },
              { name: 'email', isUnique: true },
              { name: 'username' },
            ],
          },
        },
      ],
    };

    const expectedNewConfig = {
      models: [
        {
          id: 'model-id',
          model: {
            primaryKeyFieldRefs: ['id'],
            fields: [{ name: 'id' }, { name: 'email' }, { name: 'username' }],
            uniqueConstraints: [
              {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                id: expect.any(String),
                fields: [{ fieldRef: 'email' }],
              },
            ],
          },
        },
      ],
    };

    const migratedConfig = migration005PrimaryUniqueRefs.migrate(oldConfig);
    expect(migratedConfig).toEqual(expectedNewConfig);
  });

  it('handles empty or missing uniqueConstraints gracefully', () => {
    const configWithoutUniqueConstraints = {
      models: [
        {
          model: {
            primaryKeys: ['id'],
            fields: [{ name: 'id', isId: true }, { name: 'email' }],
          },
        },
      ],
    };

    const expectedConfigWithoutUniqueConstraints = {
      models: [
        {
          model: {
            primaryKeyFieldRefs: ['id'],
            fields: [{ name: 'id' }, { name: 'email' }],
            uniqueConstraints: [],
          },
        },
      ],
    };

    const migratedConfig = migration005PrimaryUniqueRefs.migrate(
      configWithoutUniqueConstraints,
    );
    expect(migratedConfig).toEqual(expectedConfigWithoutUniqueConstraints);
  });
});
