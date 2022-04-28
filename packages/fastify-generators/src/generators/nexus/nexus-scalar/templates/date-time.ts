// @ts-nocheck
import { Kind } from 'graphql';
import { scalarType } from 'nexus';
import { BadRequestError } from '%http-errors';

export const DateTimeScalar = scalarType({
  name: 'DateTime',
  asNexusMethod: 'dateTime',
  description: 'DateTime custom scalar type',
  sourceType: 'Date | string',
  parseValue(value: unknown) {
    if (value === 'string') {
      return new Date(value);
    }
    throw new BadRequestError('DateTime field must be provided as a string');
  },
  serialize(value: unknown) {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'string') {
      return new Date(value).toISOString();
    }
    throw new BadRequestError(
      'DateTime field must be provided as a Date object or string'
    );
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  },
});
