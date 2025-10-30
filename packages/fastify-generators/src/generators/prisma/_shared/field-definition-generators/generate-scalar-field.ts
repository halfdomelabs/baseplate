import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { TsCodeUtils, tsTemplate } from '@baseplate-dev/core-generators';

import type { ScalarFieldType } from '#src/types/field-types.js';

import type { PrismaGeneratedImportsProvider } from '../../_providers/prisma-generated-imports.js';
import type { DataUtilsImportsProvider } from '../../data-utils/index.js';

/**
 * Configuration for generating a scalar field definition
 */
export interface GenerateScalarFieldConfig {
  /** Prisma scalar type */
  scalarType: ScalarFieldType;
  /** Whether the field is optional in Prisma schema */
  isOptional: boolean;
  /** Name of the enum if the scalar type is 'enum' */
  enumName?: string;
  /** Data utils imports */
  dataUtilsImports: DataUtilsImportsProvider;
  /** Prisma generated imports */
  prismaGeneratedImports: PrismaGeneratedImportsProvider;
}

const SCALAR_TYPE_TO_ZOD_TYPE: Record<ScalarFieldType, string> = {
  string: 'string()',
  int: 'number().int()',
  float: 'number()',
  decimal: 'number()',
  boolean: 'boolean()',
  date: 'date()',
  dateTime: 'date()',
  json: 'unknown()',
  jsonObject: 'record(unknown())',
  uuid: 'string().uuid()',
  enum: '',
};

function generateValidator(config: GenerateScalarFieldConfig): TsCodeFragment {
  const { scalarType, enumName, prismaGeneratedImports, isOptional } = config;
  const zFrag = TsCodeUtils.importFragment('z', 'zod');

  if (scalarType === 'enum') {
    if (!enumName) {
      throw new Error('Enum name is required for enum scalar type');
    }
    const enumFrag = prismaGeneratedImports.$Enums.fragment();
    return tsTemplate`${zFrag}.nativeEnum(${enumFrag}.${enumName})${isOptional ? '.nullish()' : ''}`;
  }

  return tsTemplate`${zFrag}.${SCALAR_TYPE_TO_ZOD_TYPE[scalarType]}${isOptional ? '.nullish()' : ''}`;
}

/**
 * Generates a scalar field definition, e.g. scalarField(z.string())
 */
export function generateScalarField(
  config: GenerateScalarFieldConfig,
): TsCodeFragment {
  const validator = generateValidator(config);
  return tsTemplate`${config.dataUtilsImports.scalarField.fragment()}(${validator})`;
}
