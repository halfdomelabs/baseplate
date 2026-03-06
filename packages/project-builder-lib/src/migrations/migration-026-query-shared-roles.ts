import { uniq } from 'es-toolkit';

import { createSchemaMigration } from './types.js';

interface QueryConfig {
  // Input fields (pre-migration)
  get?: {
    enabled?: boolean;
    roles?: string[];
  };
  list?: {
    enabled?: boolean;
    roles?: string[];
    count?: {
      enabled?: boolean;
    };
  };
  // Output fields (post-migration)
  globalRoles?: string[];
  instanceRoles?: string[];
}

interface Config {
  models?: {
    graphql?: {
      queries?: QueryConfig;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }[];
  [key: string]: unknown;
}

/**
 * Migration to merge per-query roles (get.roles, list.roles) into shared
 * queries.globalRoles + queries.instanceRoles for unified read permissions.
 */
export const migration026QuerySharedRoles = createSchemaMigration<
  Config,
  Config
>({
  version: 26,
  name: 'querySharedRoles',
  description:
    'Merge per-query roles into shared queries.globalRoles and queries.instanceRoles',
  migrate: (config) => {
    if (!config.models) {
      return config;
    }

    const updatedModels = config.models.map((model) => {
      const queries = model.graphql?.queries;
      if (!queries) {
        return model;
      }

      const getRoles = queries.get?.roles ?? [];
      const listRoles = queries.list?.roles ?? [];

      // Merge roles from get and list (deduplicated)
      const globalRoles = uniq([...getRoles, ...listRoles]);

      return {
        ...model,
        graphql: {
          ...model.graphql,
          queries: {
            globalRoles,
            instanceRoles: [],
            get: {
              enabled: queries.get?.enabled ?? false,
            },
            list: {
              enabled: queries.list?.enabled ?? false,
              count: queries.list?.count ?? {},
            },
          },
        },
      };
    });

    return {
      ...config,
      models: updatedModels,
    };
  },
});
