import {
  tsCodeFragment,
  TsCodeUtils,
  tsTemplate,
} from '@halfdomelabs/core-generators';
import { notEmpty, quot } from '@halfdomelabs/utils';

import type {
  ServiceOutputDtoField,
  ServiceOutputDtoNestedField,
} from '@src/types/service-output.js';

import { lowerCaseFirst } from '@src/utils/case.js';

import type {
  PothosCodeFragment,
  PothosTypeDefinitionWithVariableName,
} from './definitions.js';
import type { PothosWriterOptions } from './options.js';

import { getPothosTypeAsFragment, writePothosFieldOptions } from './helpers.js';
import { writePothosObjectFieldFromDtoScalarField } from './scalar-fields.js';

function writeSimplePothosObjectFieldFromDtoNestedField(
  field: ServiceOutputDtoNestedField,
  options: PothosWriterOptions,
): PothosCodeFragment {
  // recursive call

  const pothosType = getPothosTypeForNestedObject(field, options);

  const fieldOptions = writePothosFieldOptions({
    nullable: field.isOptional,
    type: pothosType.fragment,
  });

  return {
    fragment: tsTemplate`${options.fieldBuilder}.field(${fieldOptions ?? ''})`,
    dependencies: pothosType.dependencies,
  };
}

export function writePothosSimpleObjectFieldsFromDtoFields(
  fields: ServiceOutputDtoField[],
  options: PothosWriterOptions,
): PothosCodeFragment {
  const pothosFields: PothosCodeFragment[] = fields.map((field) => {
    if (field.type === 'scalar') {
      return {
        fragment: writePothosObjectFieldFromDtoScalarField(field, options),
      };
    }
    return writeSimplePothosObjectFieldFromDtoNestedField(field, options);
  });

  return {
    fragment: TsCodeUtils.mergeFragmentsAsObject(
      Object.fromEntries(
        pothosFields.map((field, i) => [fields[i].name, field.fragment]),
      ),
      // TODO: Re-enable sort once we have better ways of sorting Prisma fields
      { wrapWithParenthesis: true, disableSort: true },
    ),
    dependencies: pothosFields
      .flatMap((field) => field.dependencies)
      .filter(notEmpty),
  };
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

function getPothosTypeForNestedObject(
  field: ServiceOutputDtoNestedField,
  options: PothosWriterOptions,
): PothosCodeFragment {
  const { name } = field.nestedType;

  const objectType = options.typeReferences?.find((x) => x.name === name);

  if (objectType) {
    return {
      fragment: getPothosTypeAsFragment(objectType.fragment, field.isList),
    };
  }

  if (field.isPrismaType) {
    throw new Error(`Prisma type ${name} not found in type references`);
  }

  const { fields } = field.nestedType;

  const pothosObjectTypeDefinition =
    writePothosSimpleObjectDefinitionFromDtoFields(name, fields, options);

  return {
    fragment: getPothosTypeAsFragment(
      tsCodeFragment(pothosObjectTypeDefinition.variableName),
      field.isList,
    ),
    dependencies: [pothosObjectTypeDefinition],
  };
}
