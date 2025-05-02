import {
  tsCodeFragment,
  TsCodeUtils,
  tsTemplate,
} from '@halfdomelabs/core-generators';
import { quot } from '@halfdomelabs/utils';

import type {
  ServiceOutputDtoField,
  ServiceOutputDtoNestedField,
} from '@src/types/service-output.js';

import { notEmpty } from '@src/utils/array.js';
import { lowerCaseFirst } from '@src/utils/case.js';

import type {
  PothosCodeFragment,
  PothosTypeDefinitionWithVariableName,
} from './definitions.js';
import type { PothosWriterOptions } from './options.js';

import { getPothosTypeAsFragment, writePothosFieldOptions } from './helpers.js';
import { writePothosInputFieldFromDtoScalarField } from './scalar-fields.js';

function writePothosInputFieldFromDtoNestedField(
  field: ServiceOutputDtoNestedField,
  options: PothosWriterOptions,
): PothosCodeFragment {
  // recursive call
  const pothosType = getPothosTypeForNestedInput(field, options);

  const fieldOptions = writePothosFieldOptions({
    required: !field.isOptional,
    type: pothosType.fragment,
  });

  return {
    fragment: tsTemplate`${options.fieldBuilder}.field(${fieldOptions ?? ''})`,
    dependencies: pothosType.dependencies,
  };
}

export function writePothosInputFieldsFromDtoFields(
  fields: ServiceOutputDtoField[],
  options: PothosWriterOptions,
): PothosCodeFragment {
  const pothosFields: PothosCodeFragment[] = fields.map((field) => {
    if (field.type === 'scalar') {
      return {
        fragment: writePothosInputFieldFromDtoScalarField(field, options),
      };
    }
    return writePothosInputFieldFromDtoNestedField(field, options);
  });

  return {
    fragment: TsCodeUtils.mergeFragmentsAsObject(
      Object.fromEntries(
        pothosFields.map((field, i) => [fields[i].name, field.fragment]),
      ),
      { wrapWithParenthesis: true, disableSort: true },
    ),
    dependencies: pothosFields
      .flatMap((field) => field.dependencies)
      .filter(notEmpty),
  };
}

export function writePothosInputDefinitionFromDtoFields(
  name: string,
  fields: ServiceOutputDtoField[],
  options: PothosWriterOptions,
  shouldExport?: boolean,
): PothosTypeDefinitionWithVariableName {
  const pothosFields = writePothosInputFieldsFromDtoFields(fields, {
    ...options,
    fieldBuilder: 't',
  });

  const variableName = `${lowerCaseFirst(name)}InputType`;

  const fragment = TsCodeUtils.formatFragment(
    `${
      shouldExport ? `export ` : ''
    }const VARIABLE_NAME = BUILDER.inputType(NAME, {
      fields: (t) => FIELDS
    })`,
    {
      VARIABLE_NAME: variableName,
      BUILDER: options.schemaBuilder,
      NAME: quot(name),
      FIELDS: pothosFields.fragment,
    },
  );

  return {
    name,
    variableName,
    fragment,
    dependencies: pothosFields.dependencies,
  };
}

export function getPothosTypeForNestedInput(
  field: ServiceOutputDtoNestedField,
  options: PothosWriterOptions,
): PothosCodeFragment {
  if (field.isPrismaType) {
    throw new Error(`Prisma types are not supported in input fields`);
  }
  const { name, fields } = field.nestedType;

  // Check if the input type is already defined in the base types
  const inputType =
    options.pothosSchemaBaseTypes.inputRef(name) ??
    options.typeReferences?.find((x) => x.name === name);

  if (inputType) {
    return {
      fragment: getPothosTypeAsFragment(inputType.fragment, field.isList),
    };
  }

  const pothosInputType = writePothosInputDefinitionFromDtoFields(
    name,
    fields,
    options,
  );

  return {
    fragment: getPothosTypeAsFragment(
      tsCodeFragment(pothosInputType.variableName),
      field.isList,
    ),
    dependencies: [pothosInputType],
  };
}
