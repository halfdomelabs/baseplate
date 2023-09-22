// @ts-nocheck
import { Kind } from 'graphql';
import { builder } from '%pothos';
import { BadRequestError } from '%http-errors';

const DATE_REGEX = /^[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}$/;

function parseDateString(value: string): Date {
  // timezones can be very wonky so we expect only a simple YYYY-MM-DD string
  if (!DATE_REGEX.test(value)) {
    throw new BadRequestError(
      'Date field must be provided as a string with format YYYY-MM-DD',
    );
  }
  // this ensures that we will always be using UTC timezone
  return new Date(`${value}T00:00:00.000Z`);
}

function formatDateString(value: Date): string {
  return value.toISOString().split('T')[0];
}

export const DateScalar = builder.scalarType('Date', {
  description: 'Date custom scalar type',
  parseValue(value) {
    if (typeof value === 'string') {
      return parseDateString(value);
    }
    throw new BadRequestError('Date field must be provided as a string');
  },
  serialize(value) {
    if (value instanceof Date) {
      return formatDateString(value);
    }
    if (typeof value === 'string') {
      return formatDateString(new Date(value));
    }
    throw new BadRequestError(
      'DateTime field must be provided as a Date object or string',
    );
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return parseDateString(ast.value);
    }
    throw new BadRequestError('Date field must be provided as a string');
  },
});
