import { quot, TypescriptCodeUtils } from '@halfdomelabs/core-generators';

import type {
  ServiceOutputDtoField,
  ServiceOutputDtoNestedField,
} from '@src/types/service-output.js';

import { notEmpty } from '@src/utils/array.js';
import { lowerCaseFirst } from '@src/utils/case.js';

import type {
  PothosExpressionWithChildren,
  PothosTypeDefinitionWithChildren,
} from './definitions.js';
import type { PothosWriterOptions } from './options.js';

import { wrapPothosTypeWithList, writePothosFieldOptions } from './helpers.js';
import { getExpressionFromPothosTypeReference } from './options.js';
import { writePothosObjectFieldFromDtoScalarField } from './scalar-fields.js';

function writeSimplePothosObjectFieldFromDtoNestedField(
  field: ServiceOutputDtoNestedField,
  options: PothosWriterOptions,
): PothosExpressionWithChildren {
  // recursive call

  const pothosType = getPothosTypeForNestedObject(field, options);

  const fieldOptions = writePothosFieldOptions({
    nullable: field.isOptional,
    type: pothosType.expression,
  });

  return {
    expression: TypescriptCodeUtils.formatExpression(`BUILDER.field(OPTIONS)`, {
      BUILDER: options.fieldBuilder,
      OPTIONS: fieldOptions ?? '',
    }),
    childDefinitions: pothosType.childDefinitions,
  };
}

export function writePothosSimpleObjectFieldsFromDtoFields(
  fields: ServiceOutputDtoField[],
  options: PothosWriterOptions,
): PothosExpressionWithChildren {
  const pothosFields: PothosExpressionWithChildren[] = fields.map((field) => {
    if (field.type === 'scalar') {
      return {
        expression: writePothosObjectFieldFromDtoScalarField(field, options),
      };
    }
    return writeSimplePothosObjectFieldFromDtoNestedField(field, options);
  });

  return {
    expression: TypescriptCodeUtils.mergeExpressionsAsObject(
      Object.fromEntries(
        pothosFields.map((field, i) => [fields[i].name, field.expression]),
      ),
      { wrapWithParenthesis: true },
    ),
    childDefinitions: pothosFields
      .flatMap((field) => field.childDefinitions)
      .filter(notEmpty),
  };
}

function writePothosSimpleObjectDefinitionFromDtoFields(
  name: string,
  fields: ServiceOutputDtoField[],
  options: PothosWriterOptions,
): PothosTypeDefinitionWithChildren {
  const pothosFields = writePothosSimpleObjectFieldsFromDtoFields(fields, {
    ...options,
    fieldBuilder: 't',
  });

  const exportName = `${lowerCaseFirst(name)}ObjectType`;

  const definition = TypescriptCodeUtils.formatBlock(
    `const EXPORT_NAME = BUILDER.simpleObject(NAME, {
      fields: (t) => FIELDS
    })`,
    {
      EXPORT_NAME: exportName,
      BUILDER: options.schemaBuilder,
      NAME: quot(name),
      FIELDS: pothosFields.expression,
    },
  );

  return {
    name,
    exportName,
    definition,
    childDefinitions: pothosFields.childDefinitions,
  };
}

function getPothosTypeForNestedObject(
  field: ServiceOutputDtoNestedField,
  options: PothosWriterOptions,
): PothosExpressionWithChildren {
  const { name } = field.nestedType;
  const objectType = options.typeReferences.getObjectType(name);

  if (objectType) {
    return {
      expression: wrapPothosTypeWithList(
        getExpressionFromPothosTypeReference(objectType),
        field.isList,
      ),
    };
  }

  if (field.isPrismaType) {
    throw new Error(`Prisma type ${name} not found in type references`);
  }

  const { fields } = field.nestedType;

  const { childDefinitions, ...objectDefinition } =
    writePothosSimpleObjectDefinitionFromDtoFields(name, fields, options);

  return {
    expression: wrapPothosTypeWithList(
      TypescriptCodeUtils.createExpression(objectDefinition.exportName),
      field.isList,
    ),
    childDefinitions: [objectDefinition, ...(childDefinitions ?? [])],
  };
}
