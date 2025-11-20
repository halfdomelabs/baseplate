import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  tsCodeFragment,
  TsCodeUtils,
  tsHoistedFragment,
  tsTemplate,
} from '@baseplate-dev/core-generators';
import { quot } from '@baseplate-dev/utils';

import type {
  ServiceOutputDtoField,
  ServiceOutputDtoNestedField,
} from '#src/types/service-output.js';

import { lowerCaseFirst } from '#src/utils/case.js';

import type { PothosTypeDefinitionWithVariableName } from './definitions.js';
import type { PothosWriterOptions } from './options.js';

import { getPothosTypeAsFragment, writePothosFieldOptions } from './helpers.js';
import { writePothosInputFieldFromDtoScalarField } from './scalar-fields.js';

function writePothosInputFieldFromDtoNestedField(
  field: ServiceOutputDtoNestedField,
  options: PothosWriterOptions,
): TsCodeFragment {
  // recursive call
  const pothosType = getPothosTypeForNestedInput(field, options);

  const fieldOptions = writePothosFieldOptions({
    required: !field.isOptional,
    type: pothosType,
  });

  return tsTemplate`${options.fieldBuilder}.field(${fieldOptions ?? '{}'})`;
}

export function writePothosInputFieldsFromDtoFields(
  fields: ServiceOutputDtoField[],
  options: PothosWriterOptions,
): TsCodeFragment {
  const pothosFields: TsCodeFragment[] = fields.map((field) => {
    if (field.type === 'scalar') {
      return writePothosInputFieldFromDtoScalarField(field, options);
    }
    return writePothosInputFieldFromDtoNestedField(field, options);
  });

  return TsCodeUtils.mergeFragmentsAsObject(
    Object.fromEntries(pothosFields.map((field, i) => [fields[i].name, field])),
    { wrapWithParenthesis: true, disableSort: true },
  );
}

export function writePothosInputDefinitionFromDtoFields(
  name: string,
  fields: ServiceOutputDtoField[],
  options: PothosWriterOptions,
  shouldExport?: boolean,
  suffix?: TsCodeFragment,
): PothosTypeDefinitionWithVariableName {
  const pothosFields = writePothosInputFieldsFromDtoFields(fields, {
    ...options,
    fieldBuilder: 't',
  });

  const variableName = `${lowerCaseFirst(name)}InputType`;

  const fragment = tsTemplate`${
    shouldExport ? `export ` : ''
  }const ${variableName} = ${options.schemaBuilder}.inputType(${quot(name)}, {
    fields: (t) => ${pothosFields}
  })${suffix ?? ''}`;

  return {
    name,
    variableName,
    fragment,
  };
}

export function getPothosTypeForNestedInput(
  field: ServiceOutputDtoNestedField,
  options: PothosWriterOptions,
): TsCodeFragment {
  if (field.isPrismaType) {
    throw new Error(`Prisma types are not supported in input fields`);
  }
  const { name, fields } = field.nestedType;

  // Check if the input type is already defined in the base types
  const inputType =
    options.pothosSchemaBaseTypes.inputRef(name) ??
    options.typeReferences?.find((x) => x.name === name);

  if (inputType) {
    return getPothosTypeAsFragment(inputType.fragment, field.isList);
  }

  const pothosInputType = writePothosInputDefinitionFromDtoFields(
    name,
    fields,
    options,
    false,
    field.zodSchemaFragment
      ? tsTemplate`.validate(${field.zodSchemaFragment})`
      : undefined,
  );

  return getPothosTypeAsFragment(
    tsCodeFragment(pothosInputType.variableName, [], {
      hoistedFragments: [
        tsHoistedFragment(
          `input-type:${pothosInputType.name}`,
          pothosInputType.fragment,
        ),
      ],
    }),
    field.isList,
  );
}
