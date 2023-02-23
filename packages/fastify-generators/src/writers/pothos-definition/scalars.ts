import { ScalarFieldType } from '@src/types/fieldTypes';

export interface PothosScalarConfig {
  name: string;
  scalar: ScalarFieldType;
  pothosMethod?: string | null;
}

export const DEFAULT_POTHOS_SCALAR_CONFIG: Record<
  ScalarFieldType,
  PothosScalarConfig
> = {
  string: {
    name: 'String',
    scalar: 'string',
    pothosMethod: 'string',
  },
  int: {
    name: 'Int',
    scalar: 'int',
    pothosMethod: 'int',
  },
  float: {
    name: 'Float',
    scalar: 'float',
    pothosMethod: 'float',
  },
  boolean: {
    name: 'Boolean',
    scalar: 'boolean',
    pothosMethod: 'boolean',
  },
  dateTime: {
    name: 'String',
    scalar: 'dateTime',
    pothosMethod: 'string',
  },
  date: {
    name: 'String',
    scalar: 'date',
    pothosMethod: 'string',
  },
  decimal: {
    name: 'Float',
    scalar: 'decimal',
    pothosMethod: 'float',
  },
  json: {
    name: 'String',
    scalar: 'json',
    pothosMethod: 'string',
  },
  uuid: {
    name: 'String',
    scalar: 'uuid',
    pothosMethod: 'string',
  },
  enum: {
    name: 'Enum',
    scalar: 'enum',
    pothosMethod: null,
  },
};
