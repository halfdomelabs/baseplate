import { GraphQLField } from '@src/writers/graphql/index.js';

export function convertExpressionToField(expression: string): GraphQLField {
  const parts = expression.split('.');
  if (!parts.length) {
    throw new Error(
      `Must have at least one part to expression to convert to field`
    );
  }
  return parts.reverse().reduce(
    (prev, cur) => ({
      type: 'simple',
      name: cur,
      fields: prev ? [prev] : undefined,
    }),
    undefined as undefined | GraphQLField
  ) as GraphQLField;
}
