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
import { writePothosObjectFieldFromDtoScalarField } from './scalar-fields';

export function writeSimplePothosObjectFieldFromDtoNestedField(
  field: ServiceOutputDtoNestedField,
  options: PothosWriterOptions
): PothosExpressionWithChildren {
  // recursive call
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const pothosType = getPothosTypeForNestedObject(field, options);

  const fieldOptions = writePothosFieldOptions({
    nullable: field.isOptional,
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

export function writePothosSimpleObjectFieldsFromDtoFields(
  fields: ServiceOutputDtoField[],
  options: PothosWriterOptions
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
        pothosFields.map((field, i) => [fields[i].name, field.expression])
      ),
      { wrapWithParenthesis: true }
    ),
    childDefinitions: pothosFields
      .flatMap((field) => field.childDefinitions)
      .filter(notEmpty),
  };
}

export function writePothosSimpleObjectDefinitionFromDtoFields(
  name: string,
  fields: ServiceOutputDtoField[],
  options: PothosWriterOptions
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
    }
  );

  return {
    name,
    exportName,
    definition,
    childDefinitions: pothosFields.childDefinitions,
  };
}

export function getPothosTypeForNestedObject(
  field: ServiceOutputDtoNestedField,
  options: PothosWriterOptions
): PothosExpressionWithChildren {
  const { name } = field.nestedType;
  const objectType = options.typeReferences.getObjectType(name);

  if (objectType) {
    return {
      expression: wrapPothosTypeWithList(
        getExpressionFromPothosTypeReference(objectType),
        field.isList
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
      field.isList
    ),
    childDefinitions: [objectDefinition, ...(childDefinitions || [])],
  };
}
