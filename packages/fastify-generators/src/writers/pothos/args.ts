import type { TsCodeFragment } from '@halfdomelabs/core-generators';

import { TsCodeUtils, tsTemplate } from '@halfdomelabs/core-generators';
import { safeMergeAllWithOptions } from '@halfdomelabs/utils';

import type {
  ServiceOutputDtoField,
  ServiceOutputDtoNestedField,
  ServiceOutputDtoScalarField,
} from '@src/types/service-output.js';

import type { PothosWriterOptions } from './options.js';

import {
  getPothosMethodAndTypeForScalar,
  writePothosFieldOptions,
} from './helpers.js';
import { getPothosTypeForNestedInput } from './input-types.js';

function writePothosArgFromDtoScalarField(
  field: ServiceOutputDtoScalarField,
  options: PothosWriterOptions,
): TsCodeFragment {
  const { methodName = 'arg', type } = getPothosMethodAndTypeForScalar(
    field,
    options,
  );
  const argOptions = writePothosFieldOptions({
    required: !field.isOptional,
    type,
  });

  return tsTemplate`${options.fieldBuilder}.${methodName}(${argOptions ?? ''})`;
}

function writePothosArgFromDtoNestedField(
  field: ServiceOutputDtoNestedField,
  options: PothosWriterOptions,
): TsCodeFragment {
  const pothosType = getPothosTypeForNestedInput(field, options);
  const argOptions = writePothosFieldOptions({
    required: !field.isOptional,
    type: pothosType,
  });

  return tsTemplate`${options.fieldBuilder}.arg(${argOptions ?? ''})`;
}

export function writePothosArgsFromDtoFields(
  fields: ServiceOutputDtoField[],
  options: PothosWriterOptions,
): TsCodeFragment {
  const argOutputs = fields.map((field) => {
    if (field.type === 'nested') {
      return { [field.name]: writePothosArgFromDtoNestedField(field, options) };
    }
    return { [field.name]: writePothosArgFromDtoScalarField(field, options) };
  });
  const argMap = safeMergeAllWithOptions(argOutputs);
  return TsCodeUtils.mergeFragmentsAsObject(argMap);
}
