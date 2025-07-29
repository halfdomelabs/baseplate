import type { GraphQLField } from '#src/writers/graphql/index.js';

export function convertExpressionToField(expression: string): GraphQLField {
  const parts = expression.split('.').toReversed();

  let result: GraphQLField | undefined;
  for (const part of parts) {
    result = {
      type: 'simple',
      name: part,
      fields: result ? [result] : undefined,
    };
  }

  if (!result) {
    throw new Error(
      `Must have at least one part to expression to convert to field`,
    );
  }

  return result;
}
