import { describe, expect, it } from 'vitest';

import { migration034HoistConnectionConfig } from './migration-034-hoist-connection-config.js';

const { migrate } = migration034HoistConnectionConfig;

describe('migration034HoistConnectionConfig', () => {
  it('hoists connection, where, and orderBy into queries', () => {
    const result = migrate({
      models: [
        {
          graphql: {
            queries: {
              list: {
                enabled: true,
                connection: { enabled: true },
                where: { enabled: true },
                orderBy: { enabled: true },
              },
            },
          },
        },
      ],
    });

    expect(result.models?.[0]?.graphql?.queries).toEqual({
      list: { enabled: true },
      connection: { enabled: true },
      where: { enabled: true },
      orderBy: { enabled: true },
    });
  });

  it('keeps count under list', () => {
    const result = migrate({
      models: [
        {
          graphql: {
            queries: {
              list: {
                enabled: true,
                count: { enabled: true },
                connection: { enabled: true },
              },
            },
          },
        },
      ],
    });

    expect(result.models?.[0]?.graphql?.queries).toEqual({
      list: { enabled: true, count: { enabled: true } },
      connection: { enabled: true },
    });
  });

  it('hoists only the keys that are present', () => {
    const result = migrate({
      models: [
        {
          graphql: {
            queries: {
              list: { enabled: true, where: { enabled: true } },
            },
          },
        },
      ],
    });

    expect(result.models?.[0]?.graphql?.queries).toEqual({
      list: { enabled: true },
      where: { enabled: true },
    });
  });

  it('preserves disabled toggles rather than dropping them', () => {
    const result = migrate({
      models: [
        {
          graphql: {
            queries: {
              list: { enabled: false, connection: { enabled: false } },
            },
          },
        },
      ],
    });

    expect(result.models?.[0]?.graphql?.queries).toEqual({
      list: { enabled: false },
      connection: { enabled: false },
    });
  });

  it('forces connection off when the list it depended on is disabled', () => {
    // The old gate was `list.enabled && list.connection.enabled`, so this
    // generated nothing. Hoisting verbatim would add a root field on upgrade.
    const result = migrate({
      models: [
        {
          graphql: {
            queries: {
              list: {
                enabled: false,
                connection: { enabled: true },
                where: { enabled: true },
                orderBy: { enabled: true },
              },
            },
          },
        },
      ],
    });

    expect(result.models?.[0]?.graphql?.queries).toEqual({
      list: { enabled: false },
      connection: { enabled: false },
      where: { enabled: true },
      orderBy: { enabled: true },
    });
  });

  it('forces connection off when list.enabled is absent', () => {
    const result = migrate({
      models: [
        {
          graphql: {
            queries: { list: { connection: { enabled: true } } },
          },
        },
      ],
    });

    expect(result.models?.[0]?.graphql?.queries).toEqual({
      list: {},
      connection: { enabled: false },
    });
  });

  it('preserves sibling query config such as roles and get', () => {
    const result = migrate({
      models: [
        {
          graphql: {
            queries: {
              globalRoles: ['admin'],
              get: { enabled: true },
              list: { enabled: true, connection: { enabled: true } },
            },
          },
        },
      ],
    });

    expect(result.models?.[0]?.graphql?.queries).toEqual({
      globalRoles: ['admin'],
      get: { enabled: true },
      list: { enabled: true },
      connection: { enabled: true },
    });
  });

  it('leaves adjacent graphql config untouched', () => {
    const result = migrate({
      models: [
        {
          name: 'TodoList',
          graphql: {
            objectType: { enabled: true },
            orderBy: { fields: ['position'] },
            queries: { list: { enabled: true, connection: { enabled: true } } },
          },
        },
      ],
    });

    expect(result.models?.[0]).toEqual({
      name: 'TodoList',
      graphql: {
        objectType: { enabled: true },
        orderBy: { fields: ['position'] },
        queries: { list: { enabled: true }, connection: { enabled: true } },
      },
    });
  });

  it('leaves models without a list config untouched', () => {
    const result = migrate({
      models: [{ graphql: { queries: { get: { enabled: true } } } }],
    });

    expect(result.models?.[0]?.graphql?.queries).toEqual({
      get: { enabled: true },
    });
  });

  it('returns an empty config unchanged', () => {
    expect(migrate({})).toEqual({});
  });
});
