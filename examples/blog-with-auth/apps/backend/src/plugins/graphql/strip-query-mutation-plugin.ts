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
 * Strips empty Query, Mutation, and Subscription root types from the schema.
 *
 * A root type can end up with no fields when a feature registers the type (e.g.
 * `builder.subscriptionType()`) but no fields are actually added — GraphQL code
 * generation and linting throw on an empty object type, so we remove it here.
 */
export class PothosStripQueryMutationPlugin<
  Types extends SchemaTypes,
> extends BasePlugin<Types> {
  afterBuild(schema: GraphQLSchema): GraphQLSchema {
    const isQueryEmpty = isObjectTypeEmpty(schema.getQueryType());
    const isMutationEmpty = isObjectTypeEmpty(schema.getMutationType());
    const isSubscriptionEmpty = isObjectTypeEmpty(schema.getSubscriptionType());

    if (!isQueryEmpty && !isMutationEmpty && !isSubscriptionEmpty) {
      return schema;
    }

    const schemaConfig = schema.toConfig();

    return new GraphQLSchema({
      ...schemaConfig,
      query: isQueryEmpty ? undefined : schemaConfig.query,
      mutation: isMutationEmpty ? undefined : schemaConfig.mutation,
      subscription: isSubscriptionEmpty ? undefined : schemaConfig.subscription,
      types: schemaConfig.types.filter((t) => {
        if (t.name === 'Query' && isQueryEmpty) return false;
        if (t.name === 'Mutation' && isMutationEmpty) return false;
        if (t.name === 'Subscription' && isSubscriptionEmpty) return false;
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
