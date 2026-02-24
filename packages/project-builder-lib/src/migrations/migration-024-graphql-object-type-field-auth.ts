import { createSchemaMigration } from './types.js';

interface ObjectTypeFieldEntry {
  ref: string;
  globalRoles: string[];
  instanceRoles: string[];
}

// Input entries may be plain strings or objects with either `roles` (old) or `globalRoles` (new)
type InputEntry =
  | string
  | {
      ref: string;
      roles?: string[];
      globalRoles?: string[];
      instanceRoles?: string[];
    };

interface Config {
  models?: {
    graphql?: {
      objectType?: {
        enabled?: boolean;
        fields?: InputEntry[];
        localRelations?: InputEntry[];
        foreignRelations?: InputEntry[];
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }[];
  [key: string]: unknown;
}

function migrateRefArray(
  refs: InputEntry[] | undefined,
): ObjectTypeFieldEntry[] | undefined {
  if (!refs) {
    return undefined;
  }
  return refs.map((ref) => {
    if (typeof ref === 'string') {
      return { ref, globalRoles: [], instanceRoles: [] };
    }
    return {
      ref: ref.ref,
      globalRoles: ref.globalRoles ?? ref.roles ?? [],
      instanceRoles: ref.instanceRoles ?? [],
    };
  });
}

/**
 * Migration to convert GraphQL objectType fields, localRelations, and
 * foreignRelations from string[] (plain ID refs) to Array<{ ref, globalRoles, instanceRoles }>
 * to support per-field authorization configuration.
 */
export const migration024GraphqlObjectTypeFieldAuth = createSchemaMigration<
  Config,
  Config
>({
  version: 24,
  name: 'graphqlObjectTypeFieldAuth',
  description:
    'Convert GraphQL objectType field/relation arrays to objects with per-field auth support',
  migrate: (config) => {
    if (!config.models) {
      return config;
    }

    const updatedModels = config.models.map((model) => {
      const objectType = model.graphql?.objectType;
      if (!objectType) {
        return model;
      }

      return {
        ...model,
        graphql: {
          ...model.graphql,
          objectType: {
            ...objectType,
            fields: migrateRefArray(objectType.fields),
            localRelations: migrateRefArray(objectType.localRelations),
            foreignRelations: migrateRefArray(objectType.foreignRelations),
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
