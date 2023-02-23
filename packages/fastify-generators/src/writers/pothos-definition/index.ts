import {
  TypescriptCodeBlock,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@baseplate/core-generators';
import { ScalarFieldType } from '@src/types/fieldTypes';
import {
  ServiceOutputDtoField,
  ServiceOutputDtoNestedField,
  ServiceOutputDtoScalarField,
} from '@src/types/serviceOutput';
import { lowerCaseFirst } from '@src/utils/case';
import { PothosScalarConfig } from './scalars';

export interface PothosDefinitionWriterOptions {
  builder: string;
  lookupScalar: (name: ScalarFieldType) => PothosScalarConfig;
  lookupEnum: (name: string) => TypescriptCodeExpression;
  lookupInputType: (name: string) => TypescriptCodeExpression;
  lookupObjectType: (name: string) => TypescriptCodeExpression;
}

export function writePothosObjectTypeFieldFromDtoNestedField(
  field: ServiceOutputDtoNestedField,
  resolver: TypescriptCodeExpression,
  options: PothosDefinitionWriterOptions
): TypescriptCodeExpression {
  const typeExpression = options.lookupObjectType(field.nestedType.name);

  return TypescriptCodeUtils.mergeExpressionsAsObject({
    type: field.isList
      ? typeExpression.wrap((contents) => `[${contents}]`)
      : typeExpression,
    nullable: field.isOptional ? 'false' : undefined,
    resolve: resolver,
  }).wrap((contents) => `${options.builder}.field(${contents})`);
}

export function writePothosDefinitionFromDtoScalarField(
  field: ServiceOutputDtoScalarField,
  options: PothosDefinitionWriterOptions
): TypescriptCodeExpression {
  const { pothosMethod, name: scalarName } = options.lookupScalar(
    field.scalarType
  );

  // prefer use of .id instead of .uuid for IDs
  const pothosMethodWithId =
    field.isId && (field.scalarType === 'uuid' || field.scalarType === 'string')
      ? 'id'
      : pothosMethod;

  if (field.scalarType === 'enum' && !field.enumType) {
    throw new Error(`All enum types must have enumType specified!`);
  }

  const scalarType =
    field.scalarType === 'enum'
      ? options.lookupEnum(field.enumType?.name || '')
      : new TypescriptCodeExpression(scalarName);
  const scalarTypeWithList = field.isList
    ? scalarType.wrap((contents) => `[${contents}]`)
    : scalarType;

  return TypescriptCodeUtils.formatExpression(
    `BUILDER.POTHOS_METHOD(ARGUMENTS)`,
    {
      BUILDER: options.builder,
      POTHOS_METHOD: pothosMethodWithId
        ? `${pothosMethodWithId}${field.isList ? 'List' : ''}`
        : 'field',
      ARGUMENTS: TypescriptCodeUtils.mergeExpressionsAsObject({
        type: pothosMethodWithId ? undefined : scalarTypeWithList,
        nullable: field.isOptional ? 'false' : undefined,
      }),
    }
  );
}

function writePothosInputDefinitionFromDtoNestedField(
  field: ServiceOutputDtoNestedField,
  options: PothosDefinitionWriterOptions
): TypescriptCodeExpression {
  const typeExpression = options.lookupInputType(field.nestedType.name);

  return TypescriptCodeUtils.mergeExpressionsAsObject({
    type: field.isList
      ? typeExpression.wrap((contents) => `[${contents}]`)
      : typeExpression,
    required: field.isOptional ? undefined : 'true',
  }).wrap((contents) => `${options.builder}.field(${contents})`);
}

export interface ChildInputDefinition {
  name: string;
  definition: TypescriptCodeExpression;
}

interface InputDefinition {
  definition: TypescriptCodeExpression;
  childInputDefinitions: ChildInputDefinition[];
}

export function writePothosInputDefinitionFromDtoFields(
  fields: ServiceOutputDtoField[],
  options: PothosDefinitionWriterOptions
): InputDefinition {
  const inputDefinitions = fields.map((field) => {
    if (field.type === 'nested') {
      if (options.lookupInputType(field.nestedType.name)) {
        return {
          name: field.name,
          definition: writePothosInputDefinitionFromDtoNestedField(
            field,
            options
          ),
          childInputDefinitions: [],
        };
      }
      const { definition: childDefinition, childInputDefinitions } =
        writePothosInputDefinitionFromDtoFields(
          field.nestedType.fields,
          options
        );
      return {
        name: field.name,
        definition: writePothosInputDefinitionFromDtoNestedField(
          field,
          options
        ),
        childInputDefinitions: [
          { name: field.nestedType.name, definition: childDefinition },
          ...childInputDefinitions,
        ],
      };
    }
    return {
      name: field.name,
      definition: writePothosDefinitionFromDtoScalarField(field, options),
      childInputDefinitions: [],
    };
  });

  return {
    definition: TypescriptCodeUtils.mergeExpressionsAsObject(
      Object.fromEntries(inputDefinitions.map((d) => [d.name, d.definition])),
      { wrapWithParenthesis: true }
    ),
    childInputDefinitions: inputDefinitions.flatMap(
      (d) => d.childInputDefinitions
    ),
  };
}

const CHILD_INPUT_TYPE_TEMPLATE = `
export const INPUT_TYPE_EXPORT = BUILDER.inputObjectType('INPUT_TYPE_NAME', {
  fields: (t) => FIELDS
});
`.trim();

export function writeChildInputDefinition(
  builder: string,
  child: ChildInputDefinition
): TypescriptCodeBlock {
  return TypescriptCodeUtils.formatBlock(CHILD_INPUT_TYPE_TEMPLATE, {
    BUILDER: builder,
    INPUT_TYPE_EXPORT: `${lowerCaseFirst(child.name)}Input`,
    INPUT_TYPE_NAME: `${child.name}Input`,
    FIELDS: child.definition,
  });
}
