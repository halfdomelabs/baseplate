import { describe, expect, it } from 'vitest';

import { migration033HoistSortFilterConfig } from './migration-033-hoist-sort-filter-config.js';

const { migrate } = migration033HoistSortFilterConfig;

describe('migration033HoistSortFilterConfig', () => {
  it('hoists sortable and filterable refs into shared config', () => {
    const result = migrate({
      models: [
        {
          graphql: {
            objectType: {
              enabled: true,
              fields: [
                { ref: 'id' },
                { ref: 'position', sortable: true },
                { ref: 'name', sortable: true, filterable: true },
                { ref: 'status', filterable: true },
              ],
            },
          },
        },
      ],
    });

    const graphql = result.models?.[0]?.graphql;
    expect(graphql?.orderBy).toEqual({ fields: ['position', 'name'] });
    expect(graphql?.where).toEqual({ fields: ['name', 'status'] });
  });

  it('strips the hoisted flags from the object type fields', () => {
    const result = migrate({
      models: [
        {
          graphql: {
            objectType: {
              fields: [
                { ref: 'name', sortable: true, filterable: true },
                { ref: 'id' },
              ],
            },
          },
        },
      ],
    });

    expect(result.models?.[0]?.graphql?.objectType?.fields).toEqual([
      { ref: 'name' },
      { ref: 'id' },
    ]);
  });

  it('preserves other field properties such as roles', () => {
    const result = migrate({
      models: [
        {
          graphql: {
            objectType: {
              fields: [
                {
                  ref: 'email',
                  sortable: true,
                  globalRoles: ['admin'],
                  instanceRoles: ['self'],
                },
              ],
            },
          },
        },
      ],
    });

    expect(result.models?.[0]?.graphql?.objectType?.fields).toEqual([
      { ref: 'email', globalRoles: ['admin'], instanceRoles: ['self'] },
    ]);
  });

  it('leaves the per-surface enable switches untouched', () => {
    const queries = {
      list: {
        enabled: true,
        orderBy: { enabled: true },
        where: { enabled: true },
      },
    };
    const result = migrate({
      models: [
        {
          graphql: {
            objectType: { fields: [{ ref: 'name', sortable: true }] },
            queries,
          },
        },
      ],
    });

    expect(result.models?.[0]?.graphql?.queries).toEqual(queries);
  });

  it('emits empty field lists when no flags are set', () => {
    const result = migrate({
      models: [
        {
          graphql: { objectType: { fields: [{ ref: 'id' }, { ref: 'name' }] } },
        },
      ],
    });

    const graphql = result.models?.[0]?.graphql;
    expect(graphql?.orderBy).toEqual({ fields: [] });
    expect(graphql?.where).toEqual({ fields: [] });
  });

  it('leaves models without object type fields untouched', () => {
    const models = [{ graphql: { queries: { list: { enabled: true } } } }];
    expect(migrate({ models })).toEqual({ models });
  });

  it('returns the config unchanged when there are no models', () => {
    expect(migrate({})).toEqual({});
  });
});
