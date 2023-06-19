import {
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@halfdomelabs/core-generators';
import R from 'ramda';
import {
  ServiceOutputDtoField,
  ServiceOutputDtoNestedField,
  ServiceOutputDtoScalarField,
} from '@src/types/serviceOutput.js';
import {
  ChildInputDefinition,
  NexusDefinitionWriterOptions,
  writeNexusInputDefinitionFromDtoFields,
} from '../nexus-definition/index.js';

export interface ArgOutput {
  expression: TypescriptCodeExpression;
  childInputDefinitions: ChildInputDefinition[];
}

export function writeNexusArgFromDtoScalarField(
  field: ServiceOutputDtoScalarField,
  options: NexusDefinitionWriterOptions
): ArgOutput {
  const importTexts: string[] = [];
  let output = `'${options.lookupScalar(field.scalarType).name}'`;
  if (field.isList) {
    output = `list(nonNull(${output}))`;
    importTexts.push("import {list} from 'nexus'");
  }
  if (!field.isOptional) {
    output = `nonNull(${output})`;
    importTexts.push("import {nonNull} from 'nexus'");
  }
  return {
    expression: new TypescriptCodeExpression(output, importTexts),
    childInputDefinitions: [],
  };
}

export function writeNexusArgFromDtoNestedField(
  field: ServiceOutputDtoNestedField,
  options: NexusDefinitionWriterOptions
): ArgOutput {
  if (field.isPrismaType) {
    throw new Error(`Prisma types not support in input types.`);
  }
  const importTexts: string[] = [];
  let output = `'${field.nestedType.name}Input'`;
  if (field.isList) {
    output = `list(nonNull(${output}))`;
    importTexts.push("import {list} from 'nexus'");
  }
  if (!field.isOptional) {
    output = `nonNull(${output})`;
    importTexts.push("import {nonNull} from 'nexus'");
  }
  const { definition: childDefinition, childInputDefinitions } =
    writeNexusInputDefinitionFromDtoFields(field.nestedType.fields, options);
  return {
    expression: new TypescriptCodeExpression(output, importTexts),
    childInputDefinitions: [
      { name: field.nestedType.name, definition: childDefinition },
      ...childInputDefinitions,
    ],
  };
}

export function writeNexusArgsFromDtoFields(
  fields: ServiceOutputDtoField[],
  options: NexusDefinitionWriterOptions
): ArgOutput {
  const argOutputs = fields.map((field) => {
    if (field.type === 'nested') {
      return { [field.name]: writeNexusArgFromDtoNestedField(field, options) };
    }
    return { [field.name]: writeNexusArgFromDtoScalarField(field, options) };
  });
  const argMap = R.mergeAll(argOutputs);
  return {
    expression: TypescriptCodeUtils.mergeExpressionsAsObject(
      R.mapObjIndexed((val) => val.expression, argMap)
    ),
    childInputDefinitions: Object.values(argMap).flatMap(
      (arg) => arg.childInputDefinitions
    ),
  };
}
