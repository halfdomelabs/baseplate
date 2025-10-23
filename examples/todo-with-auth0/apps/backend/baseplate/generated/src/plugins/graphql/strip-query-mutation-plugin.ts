import type { SchemaTypes } from '@pothos/core';
import type { GraphQLObjectType } from 'graphql';

import SchemaBuilder, { BasePlugin } from '@pothos/core';
import { GraphQLSchema } from 'graphql';

export const pothosStripQueryMutationPlugin = 'stripQueryMutation';

function isObjectTypeEmpty(
  objectType: GraphQLObjectType | undefined | null,
): boolean {
  if (!objectType) return false;
  const fields = Object.keys(objectType.getFields());
  return fields.length === 0;
}

/**
 * Strips Query and Mutation types from the schema if they have no fields
 *
 * Otherwise, GraphQL code generator will throw an error with an empty type.
 */
export class PothosStripQueryMutationPlugin<
  Types extends SchemaTypes,
> extends BasePlugin<Types> {
  afterBuild(schema: GraphQLSchema): GraphQLSchema {
    const isQueryEmpty = isObjectTypeEmpty(schema.getQueryType());
    const isMutationEmpty = isObjectTypeEmpty(schema.getMutationType());

    if (!isQueryEmpty && !isMutationEmpty) return schema;

    const schemaConfig = schema.toConfig();

    return new GraphQLSchema({
      ...schemaConfig,
      query: isQueryEmpty ? undefined : schemaConfig.query,
      mutation: isMutationEmpty ? undefined : schemaConfig.mutation,
      types: schemaConfig.types.filter((t) => {
        if (t.name === 'Query' && isQueryEmpty) return false;
        if (t.name === 'Mutation' && isMutationEmpty) return false;
        return true;
      }),
    });
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace PothosSchemaTypes {
    export interface Plugins<Types extends SchemaTypes> {
      stripQueryMutation: PothosStripQueryMutationPlugin<Types>;
    }
  }
}

SchemaBuilder.registerPlugin(
  pothosStripQueryMutationPlugin,
  PothosStripQueryMutationPlugin,
);
