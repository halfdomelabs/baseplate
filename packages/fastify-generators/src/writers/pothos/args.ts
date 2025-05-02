import { TsCodeUtils, tsTemplate } from '@halfdomelabs/core-generators';
import { safeMergeAllWithOptions } from '@halfdomelabs/utils';
import { mapValues } from 'es-toolkit';

import type {
  ServiceOutputDtoField,
  ServiceOutputDtoNestedField,
  ServiceOutputDtoScalarField,
} from '@src/types/service-output.js';

import type { PothosCodeFragment } from './definitions.js';
import type { PothosWriterOptions } from './options.js';

import {
  getPothosMethodAndTypeForScalar,
  writePothosFieldOptions,
} from './helpers.js';
import { getPothosTypeForNestedInput } from './input-types.js';

function writePothosArgFromDtoScalarField(
  field: ServiceOutputDtoScalarField,
  options: PothosWriterOptions,
): PothosCodeFragment {
  const { methodName = 'arg', type } = getPothosMethodAndTypeForScalar(
    field,
    options,
  );
  const argOptions = writePothosFieldOptions({
    required: !field.isOptional,
    type,
  });

  return {
    fragment: tsTemplate`${options.fieldBuilder}.${methodName}(${argOptions ?? ''})`,
    dependencies: [],
  };
}

function writePothosArgFromDtoNestedField(
  field: ServiceOutputDtoNestedField,
  options: PothosWriterOptions,
): PothosCodeFragment {
  const pothosType = getPothosTypeForNestedInput(field, options);
  const argOptions = writePothosFieldOptions({
    required: !field.isOptional,
    type: pothosType.fragment,
  });

  return {
    fragment: tsTemplate`${options.fieldBuilder}.arg(${argOptions ?? ''})`,
    dependencies: pothosType.dependencies,
  };
}

export function writePothosArgsFromDtoFields(
  fields: ServiceOutputDtoField[],
  options: PothosWriterOptions,
): PothosCodeFragment {
  const argOutputs = fields.map((field) => {
    if (field.type === 'nested') {
      return { [field.name]: writePothosArgFromDtoNestedField(field, options) };
    }
    return { [field.name]: writePothosArgFromDtoScalarField(field, options) };
  });
  const argMap = safeMergeAllWithOptions(argOutputs);
  return {
    fragment: TsCodeUtils.mergeFragmentsAsObject(
      mapValues(argMap, (val) => val.fragment),
    ),
    dependencies: Object.values(argMap).flatMap(
      (arg) => arg.dependencies ?? [],
    ),
  };
}
