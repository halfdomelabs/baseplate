import type { TypescriptCodeExpression } from '@halfdomelabs/core-generators';

import { TypescriptCodeUtils } from '@halfdomelabs/core-generators';
import { safeMergeAllWithOptions } from '@halfdomelabs/utils';
import { mapValues } from 'es-toolkit';

import type {
  ServiceOutputDtoField,
  ServiceOutputDtoNestedField,
  ServiceOutputDtoScalarField,
} from '@src/types/service-output.js';

import type { PothosTypeDefinition } from './definitions.js';
import type { PothosWriterOptions } from './options.js';

import {
  getPothosMethodAndTypeForScalar,
  writePothosFieldOptions,
} from './helpers.js';
import { getPothosTypeForNestedInput } from './input-types.js';

interface PothosArgOutput {
  expression: TypescriptCodeExpression;
  childDefinitions?: PothosTypeDefinition[];
}

function writePothosArgFromDtoScalarField(
  field: ServiceOutputDtoScalarField,
  options: PothosWriterOptions,
): PothosArgOutput {
  const { methodName = 'arg', type } = getPothosMethodAndTypeForScalar(
    field,
    options,
  );
  const argOptions = writePothosFieldOptions({
    required: !field.isOptional,
    type,
  });

  return {
    expression: TypescriptCodeUtils.formatExpression(
      'BUILDER.METHOD(OPTIONS)',
      {
        BUILDER: options.fieldBuilder,
        METHOD: methodName,
        OPTIONS: argOptions ?? '',
      },
    ),
    childDefinitions: [],
  };
}

function writePothosArgFromDtoNestedField(
  field: ServiceOutputDtoNestedField,
  options: PothosWriterOptions,
): PothosArgOutput {
  const pothosType = getPothosTypeForNestedInput(field, options);
  const argOptions = writePothosFieldOptions({
    required: !field.isOptional,
    type: pothosType.expression,
  });

  const expression = TypescriptCodeUtils.formatExpression(
    'BUILDER.arg(OPTIONS)',
    {
      BUILDER: options.fieldBuilder,
      OPTIONS: argOptions ?? '',
    },
  );

  return { expression, childDefinitions: pothosType.childDefinitions };
}

export function writePothosArgsFromDtoFields(
  fields: ServiceOutputDtoField[],
  options: PothosWriterOptions,
): PothosArgOutput {
  const argOutputs = fields.map((field) => {
    if (field.type === 'nested') {
      return { [field.name]: writePothosArgFromDtoNestedField(field, options) };
    }
    return { [field.name]: writePothosArgFromDtoScalarField(field, options) };
  });
  const argMap = safeMergeAllWithOptions(argOutputs);
  return {
    expression: TypescriptCodeUtils.mergeExpressionsAsObject(
      mapValues(argMap, (val) => val.expression),
    ),
    childDefinitions: Object.values(argMap).flatMap(
      (arg) => arg.childDefinitions ?? [],
    ),
  };
}
