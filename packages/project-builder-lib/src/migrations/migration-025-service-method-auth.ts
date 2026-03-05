import { createSchemaMigration } from './types.js';

interface MutationConfig {
  enabled?: boolean;
  roles?: string[];
}

interface Config {
  models?: {
    service?: {
      create?: {
        enabled?: boolean;
        globalRoles?: string[];
        [key: string]: unknown;
      };
      update?: {
        enabled?: boolean;
        globalRoles?: string[];
        [key: string]: unknown;
      };
      delete?: {
        enabled?: boolean;
        globalRoles?: string[];
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
    graphql?: {
      mutations?: {
        create?: MutationConfig;
        update?: MutationConfig;
        delete?: MutationConfig;
      };
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }[];
  [key: string]: unknown;
}

/**
 * Migration to move mutation authorization roles from graphql.mutations to
 * service methods. This enables service-level authorization with support for
 * both global and instance roles.
 */
export const migration025ServiceMethodAuth = createSchemaMigration<
  Config,
  Config
>({
  version: 25,
  name: 'serviceMethodAuth',
  description:
    'Move mutation authorization roles from graphql.mutations to service methods',
  migrate: (config) => {
    if (!config.models) {
      return config;
    }

    const updatedModels = config.models.map((model) => {
      const mutations = model.graphql?.mutations;
      if (!mutations) {
        return model;
      }

      const createRoles = mutations.create?.roles ?? [];
      const updateRoles = mutations.update?.roles ?? [];
      const deleteRoles = mutations.delete?.roles ?? [];

      // Only add globalRoles to service methods that have roles to migrate
      const serviceUpdate: Record<string, unknown> = { ...model.service };
      if (createRoles.length > 0) {
        serviceUpdate.create = {
          ...model.service?.create,
          globalRoles: createRoles,
        };
      }
      if (updateRoles.length > 0) {
        serviceUpdate.update = {
          ...model.service?.update,
          globalRoles: updateRoles,
        };
      }
      if (deleteRoles.length > 0) {
        serviceUpdate.delete = {
          ...model.service?.delete,
          globalRoles: deleteRoles,
        };
      }

      return {
        ...model,
        service: serviceUpdate,
        graphql: {
          ...model.graphql,
          mutations: {
            create: { enabled: mutations.create?.enabled ?? false },
            update: { enabled: mutations.update?.enabled ?? false },
            delete: { enabled: mutations.delete?.enabled ?? false },
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
