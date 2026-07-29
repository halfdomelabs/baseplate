import { omit } from 'es-toolkit';

import { createSchemaMigration } from './types.js';

interface ToggleConfig {
  enabled?: boolean;
  [key: string]: unknown;
}

interface ListConfig {
  connection?: ToggleConfig;
  where?: ToggleConfig;
  orderBy?: ToggleConfig;
  [key: string]: unknown;
}

interface QueriesConfig {
  list?: ListConfig;
  [key: string]: unknown;
}

interface Config {
  models?: {
    graphql?: {
      queries?: QueriesConfig;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }[];
  [key: string]: unknown;
}

const HOISTED_KEYS = ['connection', 'where', 'orderBy'] as const;

/**
 * Hoists the `connection`, `where`, and `orderBy` toggles off
 * `graphql.queries.list` into `graphql.queries`.
 *
 * Cursor pagination no longer requires offset pagination, so `connection` is a
 * sibling of `list` rather than a sub-option of it. `where` and `orderBy` move
 * with it because both surfaces share them. `count` stays under `list` — it
 * counts the offset list's rows, and the connection emits its own `totalCount`.
 *
 * A connection under a disabled list is forced off: it previously generated
 * nothing, and the old UI kept the switch's value when it disabled the control,
 * so real projects hold that shape. Hoisting it verbatim would add a root field
 * plus where/orderBy input types to an existing schema on upgrade.
 */
export const migration034HoistConnectionConfig = createSchemaMigration<
  Config,
  Config
>({
  version: 34,
  name: 'hoistConnectionConfig',
  description:
    'Hoist connection, where, and orderBy toggles out of graphql.queries.list into graphql.queries',
  migrate: (config) => {
    if (!config.models) {
      return config;
    }

    return {
      ...config,
      models: config.models.map((model) => {
        const { graphql } = model;
        const list = graphql?.queries?.list;
        if (!graphql?.queries || !list) {
          return model;
        }

        const hoisted = Object.fromEntries(
          HOISTED_KEYS.filter((key) => list[key] !== undefined).map((key) => [
            key,
            key === 'connection' && list.enabled !== true
              ? { ...list[key], enabled: false }
              : list[key],
          ]),
        );

        return {
          ...model,
          graphql: {
            ...graphql,
            queries: {
              ...graphql.queries,
              ...hoisted,
              list: omit(list, HOISTED_KEYS),
            },
          },
        };
      }),
    };
  },
});
