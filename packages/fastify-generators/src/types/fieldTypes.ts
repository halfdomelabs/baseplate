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

interface ScalarFieldTypeInfo {
  typescriptType: string;
}

const scalarFieldTypeInfoMap: Record<ScalarFieldType, ScalarFieldTypeInfo> = {
  string: { typescriptType: 'string' },
  int: { typescriptType: 'number' },
  float: { typescriptType: 'number' },
  decimal: { typescriptType: 'number' },
  boolean: { typescriptType: 'boolean' },
  json: { typescriptType: 'unknown' },
  uuid: { typescriptType: 'string' },
  dateTime: { typescriptType: 'Date' },
  date: { typescriptType: 'Date' },
  enum: { typescriptType: 'string' },
};

export function getScalarFieldTypeInfo(
  scalarFieldType: ScalarFieldType
): ScalarFieldTypeInfo {
  if (scalarFieldType === 'enum') {
    throw new Error(`Enum scalar type is not supported`);
  }
  return scalarFieldTypeInfoMap[scalarFieldType];
}
