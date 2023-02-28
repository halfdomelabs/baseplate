import { quot, TypescriptCodeUtils } from '@baseplate/core-generators';
import {
  ServiceOutputDtoField,
  ServiceOutputDtoNestedField,
} from '@src/types/serviceOutput';
import { notEmpty } from '@src/utils/array';
import { lowerCaseFirst } from '@src/utils/case';
import {
  PothosExpressionWithChildren,
  PothosTypeDefinitionWithChildren,
} from './definitions';
import { wrapPothosTypeWithList, writePothosFieldOptions } from './helpers';
import {
  getExpressionFromPothosTypeReference,
  PothosWriterOptions,
} from './options';
import { writePothosInputFieldFromDtoScalarField } from './scalar-fields';

export function writePothosInputFieldFromDtoNestedField(
  field: ServiceOutputDtoNestedField,
  options: PothosWriterOptions
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
      OPTIONS: fieldOptions || '',
    }),
    childDefinitions: pothosType.childDefinitions,
  };
}

export function writePothosInputDefinitionFromDtoFields(
  name: string,
  fields: ServiceOutputDtoField[],
  options: PothosWriterOptions
): PothosTypeDefinitionWithChildren {
  const pothosFields: PothosExpressionWithChildren[] = fields.map((field) => {
    if (field.type === 'scalar') {
      return {
        expression: writePothosInputFieldFromDtoScalarField(field, {
          ...options,
          fieldBuilder: 't',
        }),
      };
    }
    return writePothosInputFieldFromDtoNestedField(field, {
      ...options,
      fieldBuilder: 't',
    });
  });

  const exportName = `${lowerCaseFirst(name)}InputType`;

  const definition = TypescriptCodeUtils.formatBlock(
    `const EXPORT_NAME = BUILDER.inputType(NAME, {
      fields: (t) => FIELDS
    })`,
    {
      EXPORT_NAME: exportName,
      BUILDER: options.schemaBuilder,
      NAME: quot(name),
      FIELDS: TypescriptCodeUtils.mergeExpressionsAsObject(
        Object.fromEntries(
          pothosFields.map((field, i) => [fields[i].name, field.expression])
        ),
        { wrapWithParenthesis: true }
      ),
    }
  );

  return {
    name,
    exportName,
    definition,
    childDefinitions: pothosFields
      .flatMap((field) => field.childDefinitions)
      .filter(notEmpty),
  };
}

export function getPothosTypeForNestedInput(
  field: ServiceOutputDtoNestedField,
  options: PothosWriterOptions
): PothosExpressionWithChildren {
  const { name, fields } = field.nestedType;
  const inputType = options.typeReferences.getInputType(name);

  if (inputType) {
    return {
      expression: wrapPothosTypeWithList(
        getExpressionFromPothosTypeReference(inputType),
        field.isList
      ),
    };
  }

  const { childDefinitions, ...inputDefinition } =
    writePothosInputDefinitionFromDtoFields(name, fields, options);

  return {
    expression: wrapPothosTypeWithList(
      TypescriptCodeUtils.createExpression(inputDefinition.exportName),
      field.isList
    ),
    childDefinitions: [inputDefinition, ...(childDefinitions || [])],
  };
}
