import { omit } from 'es-toolkit';

import { createSchemaMigration } from './types.js';

interface FieldConfig {
  ref?: string;
  filterable?: boolean;
  sortable?: boolean;
  [key: string]: unknown;
}

interface GraphqlConfig {
  objectType?: {
    fields?: FieldConfig[];
    [key: string]: unknown;
  };
  orderBy?: { fields?: string[]; defaultSort?: unknown[] };
  where?: { fields?: string[] };
  [key: string]: unknown;
}

interface Config {
  models?: {
    graphql?: GraphqlConfig;
    [key: string]: unknown;
  }[];
  [key: string]: unknown;
}

/**
 * Hoists the per-field `sortable`/`filterable` flags off
 * `graphql.objectType.fields[]` into the shared `graphql.orderBy.fields` and
 * `graphql.where.fields` lists.
 *
 * Both flags gate vocabulary used by more than one surface — the list query and
 * `orderable` list relations — so they belong beside the other shared sort and
 * filter configuration rather than under the object type. The per-surface
 * enable switches (`queries.list.orderBy.enabled`, `queries.list.where.enabled`)
 * are unaffected.
 */
export const migration033HoistSortFilterConfig = createSchemaMigration<
  Config,
  Config
>({
  version: 33,
  name: 'hoistSortFilterConfig',
  description:
    'Hoist sortable/filterable field flags into shared graphql.orderBy and graphql.where config',
  migrate: (config) => {
    if (!config.models) {
      return config;
    }

    const refsWhere = (
      fields: FieldConfig[],
      key: 'sortable' | 'filterable',
    ): string[] =>
      fields
        .filter((field) => field[key] === true)
        .map((field) => field.ref)
        .filter((ref) => ref !== undefined);

    return {
      ...config,
      models: config.models.map((model) => {
        const { graphql } = model;
        if (!graphql?.objectType?.fields) {
          return model;
        }

        const { fields } = graphql.objectType;

        return {
          ...model,
          graphql: {
            ...graphql,
            objectType: {
              ...graphql.objectType,
              fields: fields.map((field) =>
                omit(field, ['sortable', 'filterable']),
              ),
            },
            orderBy: {
              ...graphql.orderBy,
              fields: refsWhere(fields, 'sortable'),
            },
            where: {
              ...graphql.where,
              fields: refsWhere(fields, 'filterable'),
            },
          },
        };
      }),
    };
  },
});
