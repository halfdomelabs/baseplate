export const SCALAR_FIELD_TYPES = [
  'string',
  'int',
  'float',
  'decimal',
  'boolean',
  'json',
  'uuid',
  'dateTime',
  'date',
] as const;

export type ScalarFieldType = typeof SCALAR_FIELD_TYPES[number];

interface ScalarFieldTypeInfo {
  typescriptType: string;
}

export const scalarFieldTypeInfoMap: Record<
  ScalarFieldType,
  ScalarFieldTypeInfo
> = {
  string: { typescriptType: 'string' },
  int: { typescriptType: 'number' },
  float: { typescriptType: 'number' },
  decimal: { typescriptType: 'number' },
  boolean: { typescriptType: 'boolean' },
  json: { typescriptType: 'unknown' },
  uuid: { typescriptType: 'string' },
  dateTime: { typescriptType: 'Date' },
  date: { typescriptType: 'Date' },
};
