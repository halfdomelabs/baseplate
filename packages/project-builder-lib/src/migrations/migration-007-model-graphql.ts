import { createSchemaMigration } from './types.js';
import { stripUndefinedChildren, undefinedIfEmptyObject } from './utils.js';

interface OldConfig {
  models: {
    id: string;
    schema?: {
      buildObjectType?: boolean;
      exposedFields?: string[];
      exposedLocalRelations?: string[];
      exposedForeignRelations?: string[];
      buildQuery?: boolean;
      buildMutations?: boolean;
      authorize?: {
        read: string[];
        create: string[];
        update: string[];
        delete: string[];
      };
    };
  }[];
}

interface NewConfig {
  models: {
    id: string;
    graphql?: {
      objectType?: {
        enabled: boolean;
        fields: string[];
        localRelations: string[];
        foreignRelations: string[];
      };
      queries?: {
        get?: {
          enabled: boolean;
          roles: string[];
        };
        list?: {
          enabled: boolean;
          roles: string[];
        };
      };
      mutations?: {
        create?: {
          enabled: boolean;
          roles: string[];
        };
        update?: {
          enabled: boolean;
          roles: string[];
        };
        delete?: {
          enabled: boolean;
          roles: string[];
        };
      };
    };
  }[];
}

export const migration007ModelGraphql = createSchemaMigration<
  OldConfig,
  NewConfig
>({
  version: 7,
  name: 'modelGraphql',
  description: 'Migrate model schema to GraphQL schema',
  migrate: (config) => {
    return {
      ...config,
      models: config.models.map((model) => {
        const { schema, ...rest } = model;
        const {
          buildObjectType,
          exposedFields,
          exposedLocalRelations,
          exposedForeignRelations,
          buildQuery,
          buildMutations,
          authorize,
        } = schema ?? {};

        return stripUndefinedChildren({
          ...rest,
          graphql: undefinedIfEmptyObject(
            stripUndefinedChildren({
              objectType: buildObjectType
                ? {
                    enabled: !!buildObjectType,
                    fields: exposedFields ?? [],
                    localRelations: exposedLocalRelations ?? [],
                    foreignRelations: exposedForeignRelations ?? [],
                  }
                : undefined,
              queries: buildQuery
                ? {
                    get: {
                      enabled: buildQuery,
                      roles: authorize?.read ?? [],
                    },
                    list: {
                      enabled: buildQuery,
                      roles: authorize?.read ?? [],
                    },
                  }
                : undefined,
              mutations: buildMutations
                ? undefinedIfEmptyObject({
                    create:
                      !authorize || authorize.create?.length
                        ? {
                            enabled: true,
                            roles: authorize?.create ?? [],
                          }
                        : undefined,
                    update:
                      !authorize || authorize?.update?.length
                        ? {
                            enabled: true,
                            roles: authorize?.update ?? [],
                          }
                        : undefined,
                    delete:
                      !authorize || authorize?.delete?.length
                        ? {
                            enabled: true,
                            roles: authorize?.delete ?? [],
                          }
                        : undefined,
                  })
                : undefined,
            }),
          ),
        });
      }),
    };
  },
});
