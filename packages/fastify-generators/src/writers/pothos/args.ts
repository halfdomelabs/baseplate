import {
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@halfdomelabs/core-generators';
import * as R from 'ramda';
import {
  ServiceOutputDtoField,
  ServiceOutputDtoNestedField,
  ServiceOutputDtoScalarField,
} from '@src/types/serviceOutput.js';
import { PothosTypeDefinition } from './definitions.js';
import {
  getPothosMethodAndTypeForScalar,
  writePothosFieldOptions,
} from './helpers.js';
import { getPothosTypeForNestedInput } from './input-types.js';
import { PothosWriterOptions } from './options.js';

export interface PothosArgOutput {
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
        OPTIONS: argOptions || '',
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
      OPTIONS: argOptions || '',
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
  const argMap = R.mergeAll(argOutputs);
  return {
    expression: TypescriptCodeUtils.mergeExpressionsAsObject(
      R.mapObjIndexed((val) => val.expression, argMap),
    ),
    childDefinitions: Object.values(argMap).flatMap(
      (arg) => arg.childDefinitions || [],
    ),
  };
}
