// @ts-nocheck
import { Kind } from 'graphql';
import { scalarType } from 'nexus';

export const DateTimeScalar = scalarType({
  name: 'DateTime',
  asNexusMethod: 'dateTime',
  description: 'Date custom scalar type',
  sourceType: 'Date',
  parseValue(value: string) {
    return new Date(value);
  },
  serialize(value: Date) {
    return value.toISOString();
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  },
});
