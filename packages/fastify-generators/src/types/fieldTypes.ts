export const SCALAR_FIELD_TYPES = [
  'string',
  'int',
  'float',
  'decimal',
  'boolean',
  'json',
  'uuid',
  'dateTime',
] as const;

export type ScalarFieldType = typeof SCALAR_FIELD_TYPES[number];
