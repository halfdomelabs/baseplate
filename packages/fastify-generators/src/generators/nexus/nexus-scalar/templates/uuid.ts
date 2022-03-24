// @ts-nocheck
import { Kind } from 'graphql';
import { scalarType } from 'nexus';
import { validate } from 'uuid';
import { BadRequestError } from '%http-errors';

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
  parseValue(value: unknown) {
    if (typeof value === 'string') {
      return parseUuid(value);
    }
    throw new BadRequestError('Uuid field must be provided as a string');
  },
  serialize(value: unknown) {
    if (typeof value === 'string') {
      return parseUuid(value);
    }
    throw new BadRequestError('Uuid field must be provided as a string');
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return parseUuid(ast.value);
    }
    return null;
  },
});
