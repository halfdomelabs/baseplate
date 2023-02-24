import {
  quot,
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
import { lowerCaseFirst, upperCaseFirst } from '@src/utils/case';
import { PothosScalarConfig } from './scalars';

export interface PothosTypeReferences {
  scalars: Record<ScalarFieldType, PothosScalarConfig>;
  enums?: Record<string, TypescriptCodeExpression>;
  inputTypes?: Record<string, TypescriptCodeExpression>;
  objectTypes?: Record<string, TypescriptCodeExpression>;
}

export interface PothosDefinitionWriterOptions {
  builder: string;
  typeReferences: PothosTypeReferences;
}

function getObjectTypeFromOptions(
  options: PothosDefinitionWriterOptions,
  name: string
): TypescriptCodeExpression {
  const { objectTypes = {} } = options.typeReferences;
  const objectType = objectTypes[name];
  if (!objectType) {
    throw new Error(`Could not find Pothos object type ${name}`);
  }
  return objectType;
}

function getInputTypeFromOptions(
  options: PothosDefinitionWriterOptions,
  name: string
): TypescriptCodeExpression {
  const { inputTypes = {} } = options.typeReferences;
  const inputType = inputTypes[name];
  if (!inputType) {
    throw new Error(`Could not find Pothos input type ${name}`);
  }
  return inputType;
}

function getScalarTypeFromOptions(
  options: PothosDefinitionWriterOptions,
  name: ScalarFieldType
): PothosScalarConfig {
  const { scalars } = options.typeReferences;
  const scalar = scalars[name];
  if (!scalar) {
    throw new Error(`Could not find Pothos scalar ${name}`);
  }
  return scalar;
}

function getEnumTypeFromOptions(
  options: PothosDefinitionWriterOptions,
  name: string
): TypescriptCodeExpression {
  const { enums = {} } = options.typeReferences;
  const val = enums[name];
  if (!val) {
    throw new Error(`Could not find Pothos enum ${name}`);
  }
  return val;
}

export function writePothosObjectTypeFieldFromDtoNestedField(
  field: ServiceOutputDtoNestedField,
  resolver: TypescriptCodeExpression,
  options: PothosDefinitionWriterOptions
): TypescriptCodeExpression {
  const typeExpression = getObjectTypeFromOptions(
    options,
    field.nestedType.name
  );

  return TypescriptCodeUtils.mergeExpressionsAsObject({
    type: field.isList
      ? typeExpression.wrap((contents) => `[${contents}]`)
      : typeExpression,
    nullable: field.isOptional ? 'false' : undefined,
    resolve: resolver,
  }).wrap((contents) => `${options.builder}.field(${contents})`);
}

export function writePothosFieldFromDtoScalarField(
  field: ServiceOutputDtoScalarField,
  options: PothosDefinitionWriterOptions,
  isExposed?: boolean
): TypescriptCodeExpression {
  const { pothosMethod, name: scalarName } = getScalarTypeFromOptions(
    options,
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
      ? getEnumTypeFromOptions(options, field.enumType?.name || '')
      : new TypescriptCodeExpression(quot(scalarName));
  const scalarTypeWithList = field.isList
    ? scalarType.wrap((contents) => `[${contents}]`)
    : scalarType;

  const pothosMethodName = (() => {
    if (pothosMethodWithId) {
      const methodName = `${pothosMethodWithId}${field.isList ? 'List' : ''}`;
      return isExposed
        ? `expose${upperCaseFirst(methodName === 'id' ? 'ID' : methodName)}`
        : methodName;
    }
    return isExposed ? 'expose' : 'field';
  })();

  const fieldOptions = {
    type: pothosMethodWithId ? undefined : scalarTypeWithList,
    nullable: field.isOptional ? 'true' : undefined,
  };
  const hasFieldOptions = Object.values(fieldOptions).some(
    (a) => a !== undefined
  );

  const args: string[] = [];
  if (isExposed) {
    args.push(`'${field.name}'`);
  }
  if (hasFieldOptions) {
    args.push('OPTIONS');
  }

  return TypescriptCodeUtils.formatExpression(
    `BUILDER.POTHOS_METHOD(${args.join(', ')})`,
    {
      BUILDER: options.builder,
      POTHOS_METHOD: pothosMethodName,
      OPTIONS: TypescriptCodeUtils.mergeExpressionsAsObject(fieldOptions),
    }
  );
}

function writePothosInputDefinitionFromDtoNestedField(
  field: ServiceOutputDtoNestedField,
  options: PothosDefinitionWriterOptions
): TypescriptCodeExpression {
  const typeExpression = getInputTypeFromOptions(
    options,
    field.nestedType.name
  );

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
      if (getInputTypeFromOptions(options, field.nestedType.name)) {
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
      definition: writePothosFieldFromDtoScalarField(field, options),
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
