export const SCALAR_FIELD_TYPES = [
  'string',
  'uuid',
  'int',
  'boolean',
  'dateTime',
  'float',
  'decimal',
  'json',
  'date',
  'enum',
] as const;

export type ScalarFieldType = (typeof SCALAR_FIELD_TYPES)[number];
