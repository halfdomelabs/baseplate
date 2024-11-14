import type { ScalarFieldType } from '@halfdomelabs/project-builder-lib';

export interface ScalarFieldTypeOption {
  label: string;
  value: string;
  description: string;
}

export const SCALAR_FIELD_TYPE_OPTIONS: Record<
  ScalarFieldType,
  ScalarFieldTypeOption
> = {
  string: {
    label: 'String',
    value: 'string',
    description: 'Variable length text',
  },
  int: {
    label: 'Integer',
    value: 'int',
    description: 'Whole number',
  },
  float: {
    label: 'Float',
    value: 'float',
    description: 'Decimal number',
  },
  decimal: {
    label: 'Decimal',
    value: 'decimal',
    description: 'Precise decimal number',
  },
  boolean: {
    label: 'Boolean',
    value: 'boolean',
    description: 'True or false value',
  },
  json: {
    label: 'JSON',
    value: 'json',
    description: 'JSON data',
  },
  uuid: {
    label: 'UUID',
    value: 'uuid',
    description: 'Unique identifier',
  },
  dateTime: {
    label: 'DateTime',
    value: 'dateTime',
    description: 'Date and time',
  },
  date: {
    label: 'Date',
    value: 'date',
    description: 'Calendar date',
  },
  enum: {
    label: 'Enum',
    value: 'enum',
    description: 'List of values',
  },
};
