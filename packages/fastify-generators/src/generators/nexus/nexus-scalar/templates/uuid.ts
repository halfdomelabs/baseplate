// @ts-nocheck
import { Kind } from 'graphql';
import { scalarType } from 'nexus';
import { validate } from 'uuid';

function parseUuid(value: string): string {
  if (!validate(value)) {
    throw new Error(`"${value}" is not a valid UUID`);
  }
  return value;
}

export const UuidScalar = scalarType({
  name: 'Uuid',
  asNexusMethod: 'uuid',
  description: 'UUID custom scalar type',
  sourceType: 'string',
  parseValue(value: string) {
    return parseUuid(value);
  },
  serialize(value: string) {
    return parseUuid(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return parseUuid(ast.value);
    }
    return null;
  },
});
