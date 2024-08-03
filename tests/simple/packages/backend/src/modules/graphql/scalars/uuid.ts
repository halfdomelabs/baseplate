import { Kind } from 'graphql';
import { validate } from 'uuid';
import { builder } from '@src/plugins/graphql/builder';
import { BadRequestError } from '@src/utils/http-errors';

function parseUuid(value: string): string {
  if (!validate(value)) {
    throw new Error(`"${value}" is not a valid UUID`);
  }
  return value;
}

export const UuidScalar = builder.scalarType('Uuid', {
  description: 'Scalar representing a UUID',
  parseValue(value) {
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
    throw new BadRequestError('Uuid field must be provided as a string');
  },
});
