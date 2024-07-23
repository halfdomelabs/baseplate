import { quot, TypescriptCodeUtils } from '@halfdomelabs/core-generators';

import {
  PothosExpressionWithChildren,
  PothosTypeDefinitionWithChildren,
} from './definitions.js';
import { wrapPothosTypeWithList, writePothosFieldOptions } from './helpers.js';
import {
  getExpressionFromPothosTypeReference,
  PothosWriterOptions,
} from './options.js';
import { writePothosInputFieldFromDtoScalarField } from './scalar-fields.js';
import {
  ServiceOutputDtoField,
  ServiceOutputDtoNestedField,
} from '@src/types/serviceOutput.js';
import { notEmpty } from '@src/utils/array.js';
import { lowerCaseFirst } from '@src/utils/case.js';

export function writePothosInputFieldFromDtoNestedField(
  field: ServiceOutputDtoNestedField,
  options: PothosWriterOptions,
): PothosExpressionWithChildren {
  // recursive call
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const pothosType = getPothosTypeForNestedInput(field, options);

  const fieldOptions = writePothosFieldOptions({
    required: !field.isOptional,
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

export function writePothosInputFieldsFromDtoFields(
  fields: ServiceOutputDtoField[],
  options: PothosWriterOptions,
): PothosExpressionWithChildren {
  const pothosFields: PothosExpressionWithChildren[] = fields.map((field) => {
    if (field.type === 'scalar') {
      return {
        expression: writePothosInputFieldFromDtoScalarField(field, options),
      };
    }
    return writePothosInputFieldFromDtoNestedField(field, options);
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

export function writePothosInputDefinitionFromDtoFields(
  name: string,
  fields: ServiceOutputDtoField[],
  options: PothosWriterOptions,
  shouldExport?: boolean,
): PothosTypeDefinitionWithChildren {
  const pothosFields = writePothosInputFieldsFromDtoFields(fields, {
    ...options,
    fieldBuilder: 't',
  });

  const exportName = `${lowerCaseFirst(name)}InputType`;

  const definition = TypescriptCodeUtils.formatBlock(
    `${
      shouldExport ? `export ` : ''
    }const EXPORT_NAME = BUILDER.inputType(NAME, {
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

export function getPothosTypeForNestedInput(
  field: ServiceOutputDtoNestedField,
  options: PothosWriterOptions,
): PothosExpressionWithChildren {
  if (field.isPrismaType) {
    throw new Error(`Prisma types are not supported in input fields`);
  }
  const { name, fields } = field.nestedType;
  const inputType = options.typeReferences.getInputType(name);

  if (inputType) {
    return {
      expression: wrapPothosTypeWithList(
        getExpressionFromPothosTypeReference(inputType),
        field.isList,
      ),
    };
  }

  const { childDefinitions, ...inputDefinition } =
    writePothosInputDefinitionFromDtoFields(name, fields, options);

  return {
    expression: wrapPothosTypeWithList(
      TypescriptCodeUtils.createExpression(inputDefinition.exportName),
      field.isList,
    ),
    childDefinitions: [...(childDefinitions ?? []), inputDefinition],
  };
}
