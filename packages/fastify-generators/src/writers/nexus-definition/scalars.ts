import { ScalarFieldType } from '@src/types/fieldTypes.js';

export interface NexusScalarConfig {
  name: string;
  scalar: ScalarFieldType;
  nexusMethod: string | null;
  sourceType: string | null;
}

export const DEFAULT_NEXUS_SCALAR_CONFIG: Record<
  ScalarFieldType,
  NexusScalarConfig
> = {
  string: {
    name: 'String',
    scalar: 'string',
    nexusMethod: 'string',
    sourceType: 'string',
  },
  int: {
    name: 'Int',
    scalar: 'int',
    nexusMethod: 'int',
    sourceType: 'number',
  },
  float: {
    name: 'Float',
    scalar: 'float',
    nexusMethod: 'float',
    sourceType: 'number',
  },
  boolean: {
    name: 'Boolean',
    scalar: 'boolean',
    nexusMethod: 'boolean',
    sourceType: 'boolean',
  },
  dateTime: {
    name: 'String',
    scalar: 'dateTime',
    nexusMethod: 'string',
    sourceType: 'string',
  },
  date: {
    name: 'String',
    scalar: 'date',
    nexusMethod: 'string',
    sourceType: 'string',
  },
  decimal: {
    name: 'Float',
    scalar: 'decimal',
    nexusMethod: 'float',
    sourceType: 'number',
  },
  json: {
    name: 'String',
    scalar: 'json',
    nexusMethod: 'string',
    sourceType: 'string',
  },
  uuid: {
    name: 'String',
    scalar: 'uuid',
    nexusMethod: 'string',
    sourceType: 'string',
  },
  enum: {
    name: 'Enum',
    scalar: 'enum',
    nexusMethod: null,
    sourceType: null,
  },
};
