import { ScalarFieldType } from '@src/types/fieldTypes';

export interface NexusScalarConfig {
  scalar: ScalarFieldType;
  nexusMethod: string;
  sourceType: string;
}

export const DEFAULT_NEXUS_SCALAR_CONFIG: Record<
  ScalarFieldType,
  NexusScalarConfig
> = {
  string: {
    scalar: 'string',
    nexusMethod: 'string',
    sourceType: 'string',
  },
  int: {
    scalar: 'int',
    nexusMethod: 'int',
    sourceType: 'number',
  },
  float: {
    scalar: 'float',
    nexusMethod: 'float',
    sourceType: 'number',
  },
  boolean: {
    scalar: 'boolean',
    nexusMethod: 'boolean',
    sourceType: 'boolean',
  },
  dateTime: {
    scalar: 'dateTime',
    nexusMethod: 'string',
    sourceType: 'string',
  },
  decimal: {
    scalar: 'decimal',
    nexusMethod: 'number',
    sourceType: 'number',
  },
  json: {
    scalar: 'json',
    nexusMethod: 'string',
    sourceType: 'string',
  },
  uuid: {
    scalar: 'uuid',
    nexusMethod: 'string',
    sourceType: 'string',
  },
};
