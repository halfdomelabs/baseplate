import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { TsCodeUtils, tsTemplate } from '@baseplate-dev/core-generators';

import type { ScalarFieldType } from '#src/types/field-types.js';
import type { PrismaOutputScalarField } from '#src/types/prisma-output.js';
import type { ServiceOutputEnum } from '#src/types/service-output.js';

import { scalarPrismaFieldToServiceField } from '#src/types/service-output.js';

import type { PrismaGeneratedImportsProvider } from '../../_providers/prisma-generated-imports.js';
import type { DataUtilsImportsProvider } from '../../data-utils/index.js';
import type { InputFieldDefinitionOutput } from './types.js';

/**
 * Configuration for generating a scalar field definition
 */
export interface GenerateScalarFieldConfig {
  /** Name of the field */
  fieldName: string;
  /** Prisma scalar field */
  scalarField: PrismaOutputScalarField;
  /** Data utils imports */
  dataUtilsImports: DataUtilsImportsProvider;
  /** Prisma generated imports */
  prismaGeneratedImports: PrismaGeneratedImportsProvider;
  /** Lookup function for enums */
  lookupEnum: (name: string) => ServiceOutputEnum;
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

function generateValidator({
  scalarField,
  prismaGeneratedImports,
}: GenerateScalarFieldConfig): TsCodeFragment {
  const { scalarType, enumType, isOptional, hasDefault } = scalarField;
  const zFrag = TsCodeUtils.importFragment('z', 'zod');

  // Determine the modifier: optional => nullish(), hasDefault => optional(), else => none
  let modifier = '';
  if (isOptional) {
    modifier = '.nullish()';
  } else if (hasDefault) {
    modifier = '.optional()';
  }

  if (scalarType === 'enum') {
    if (!enumType) {
      throw new Error('Enum name is required for enum scalar type');
    }
    const enumFrag = prismaGeneratedImports.$Enums.fragment();
    return tsTemplate`${zFrag}.nativeEnum(${enumFrag}.${enumType})${modifier}`;
  }

  return tsTemplate`${zFrag}.${SCALAR_TYPE_TO_ZOD_TYPE[scalarType]}${modifier}`;
}

/**
 * Generates a scalar field definition, e.g. scalarField(z.string())
 */
export function generateScalarInputField(
  config: GenerateScalarFieldConfig,
): InputFieldDefinitionOutput {
  const validator = generateValidator(config);
  return {
    name: config.fieldName,
    fragment: tsTemplate`${config.dataUtilsImports.scalarField.fragment()}(${validator})`,
    outputDtoField: scalarPrismaFieldToServiceField(
      config.scalarField,
      config.lookupEnum,
    ),
  };
}
