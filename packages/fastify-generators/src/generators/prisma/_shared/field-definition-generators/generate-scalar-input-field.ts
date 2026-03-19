import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { TsCodeUtils, tsTemplate } from '@baseplate-dev/core-generators';

import type { ScalarFieldType } from '#src/types/field-types.js';
import type { PrismaOutputScalarField } from '#src/types/prisma-output.js';
import type { ServiceOutputEnum } from '#src/types/service-output.js';

import { scalarPrismaFieldToServiceInputField } from '#src/types/service-output.js';

import type { PrismaGeneratedImportsProvider } from '../../_providers/prisma-generated-imports.js';
import type { InputFieldDefinitionOutput } from './types.js';

/**
 * Configuration for generating a scalar field definition
 */
interface GenerateScalarFieldConfig {
  /** Name of the field */
  fieldName: string;
  /** Prisma scalar field */
  scalarField: PrismaOutputScalarField;
  /** Prisma generated imports */
  prismaGeneratedImports: PrismaGeneratedImportsProvider;
  /** Lookup function for enums */
  lookupEnum: (name: string) => ServiceOutputEnum;
}

const SCALAR_TYPE_TO_ZOD_TYPE: Record<ScalarFieldType, string> = {
  string: 'string()',
  int: 'int()',
  float: 'number()',
  decimal: 'number()',
  boolean: 'boolean()',
  date: 'date()',
  dateTime: 'date()',
  json: 'unknown()',
  jsonObject: 'record(z.string(), z.unknown())',
  uuid: 'uuid()',
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

  if (scalarType === 'json') {
    // JSON fields use z.json() with a transform to handle Prisma's JsonNull sentinel.
    // Use .optional() instead of .nullish() since the transform handles null → Prisma.JsonNull.
    const jsonModifier = isOptional || hasDefault ? '.optional()' : '';
    const prismaFrag = prismaGeneratedImports.Prisma.fragment();
    return tsTemplate`${zFrag}.json().transform((val) => (val === null ? ${prismaFrag}.JsonNull : val))${jsonModifier}`;
  }

  if (scalarType === 'enum') {
    if (!enumType) {
      throw new Error('Enum name is required for enum scalar type');
    }
    const enumFrag = prismaGeneratedImports.$Enums.fragment();
    return tsTemplate`${zFrag}.enum(${enumFrag}.${enumType})${modifier}`;
  }

  return tsTemplate`${zFrag}.${SCALAR_TYPE_TO_ZOD_TYPE[scalarType]}${modifier}`;
}

/**
 * Generates a scalar field's Zod schema entry, e.g. z.string()
 */
export function generateScalarInputField(
  config: GenerateScalarFieldConfig,
): InputFieldDefinitionOutput {
  const validator = generateValidator(config);
  return {
    name: config.fieldName,
    schemaFragment: validator,
    isTransformField: false,
    outputDtoField: scalarPrismaFieldToServiceInputField(
      config.scalarField,
      config.lookupEnum,
    ),
  };
}
