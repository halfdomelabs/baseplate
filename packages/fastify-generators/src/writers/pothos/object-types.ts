import type { TsCodeFragment } from '@halfdomelabs/core-generators';

import {
  tsCodeFragment,
  TsCodeUtils,
  tsHoistedFragment,
  tsTemplate,
} from '@halfdomelabs/core-generators';
import { quot } from '@halfdomelabs/utils';

import type {
  ServiceOutputDtoField,
  ServiceOutputDtoNestedField,
} from '#src/types/service-output.js';

import { lowerCaseFirst } from '#src/utils/case.js';

import type { PothosTypeDefinitionWithVariableName } from './definitions.js';
import type { PothosWriterOptions } from './options.js';

import { getPothosTypeAsFragment, writePothosFieldOptions } from './helpers.js';
import { writePothosObjectFieldFromDtoScalarField } from './scalar-fields.js';

function writeSimplePothosObjectFieldFromDtoNestedField(
  field: ServiceOutputDtoNestedField,
  options: PothosWriterOptions,
): TsCodeFragment {
  // recursive call

  const pothosType = getPothosTypeForNestedObject(field, options);

  const fieldOptions = writePothosFieldOptions({
    nullable: field.isOptional,
    type: pothosType,
  });

  return tsTemplate`${options.fieldBuilder}.field(${fieldOptions ?? ''})`;
}

export function writePothosSimpleObjectFieldsFromDtoFields(
  fields: ServiceOutputDtoField[],
  options: PothosWriterOptions,
): TsCodeFragment {
  const pothosFields: TsCodeFragment[] = fields.map((field) => {
    if (field.type === 'scalar') {
      return writePothosObjectFieldFromDtoScalarField(field, options);
    }
    return writeSimplePothosObjectFieldFromDtoNestedField(field, options);
  });

  return TsCodeUtils.mergeFragmentsAsObject(
    Object.fromEntries(pothosFields.map((field, i) => [fields[i].name, field])),
    // TODO: Re-enable sort once we have better ways of sorting Prisma fields
    { wrapWithParenthesis: true, disableSort: true },
  );
}

function writePothosSimpleObjectDefinitionFromDtoFields(
  name: string,
  fields: ServiceOutputDtoField[],
  options: PothosWriterOptions,
): PothosTypeDefinitionWithVariableName {
  const pothosFields = writePothosSimpleObjectFieldsFromDtoFields(fields, {
    ...options,
    fieldBuilder: 't',
  });

  const variableName = `${lowerCaseFirst(name)}ObjectType`;

  const fragment = TsCodeUtils.formatFragment(
    `const VARIABLE_NAME = BUILDER.simpleObject(NAME, {
      fields: (t) => FIELDS
    })`,
    {
      VARIABLE_NAME: variableName,
      BUILDER: options.schemaBuilder,
      NAME: quot(name),
      FIELDS: pothosFields,
    },
  );

  return {
    name,
    variableName,
    fragment,
  };
}

function getPothosTypeForNestedObject(
  field: ServiceOutputDtoNestedField,
  options: PothosWriterOptions,
): TsCodeFragment {
  const { name } = field.nestedType;

  const objectType = options.typeReferences?.find((x) => x.name === name);

  if (objectType) {
    return getPothosTypeAsFragment(objectType.fragment, field.isList);
  }

  if (field.isPrismaType) {
    throw new Error(`Prisma type ${name} not found in type references`);
  }

  const { fields } = field.nestedType;

  const pothosObjectTypeDefinition =
    writePothosSimpleObjectDefinitionFromDtoFields(name, fields, options);

  return getPothosTypeAsFragment(
    tsCodeFragment(pothosObjectTypeDefinition.variableName, [], {
      hoistedFragments: [
        tsHoistedFragment(
          `object-type:${pothosObjectTypeDefinition.name}`,
          pothosObjectTypeDefinition.fragment,
        ),
      ],
    }),
    field.isList,
  );
}
