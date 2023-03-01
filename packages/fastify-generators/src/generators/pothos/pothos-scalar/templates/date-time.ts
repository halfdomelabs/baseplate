// @ts-nocheck
import { Kind } from 'graphql';
import { builder } from '%pothos';
import { BadRequestError } from '%http-errors';

export const DateTimeScalar = builder.scalarType('DateTime', {
  description: 'Scalar with date and time information',
  parseValue(value) {
    if (typeof value === 'string') {
      return new Date(value);
    }
    throw new BadRequestError('DateTime field must be provided as a string');
  },
  serialize(value) {
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
    throw new BadRequestError('DateTime field must be provided as a string');
  },
});
