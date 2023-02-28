import {
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@baseplate/core-generators';
import R from 'ramda';
import {
  ServiceOutputDtoField,
  ServiceOutputDtoNestedField,
  ServiceOutputDtoScalarField,
} from '@src/types/serviceOutput';
import {
  ChildInputDefinition,
  PothosDefinitionWriterOptions,
  writePothosInputDefinitionFromDtoFields,
} from '../pothos-definition';

export interface ArgOutput {
  expression: TypescriptCodeExpression;
  childInputDefinitions: ChildInputDefinition[];
}

export function writePothosArgFromDtoScalarField(
  field: ServiceOutputDtoScalarField,
  options: PothosDefinitionWriterOptions
): ArgOutput {
  const importTexts: string[] = [];
  let output = `'${options.lookupScalar(field.scalarType).name}'`;
  if (field.isList) {
    output = `list(nonNull(${output}))`;
    importTexts.push("import {list} from 'pothos'");
  }
  if (!field.isOptional) {
    output = `nonNull(${output})`;
    importTexts.push("import {nonNull} from 'pothos'");
  }
  return {
    expression: new TypescriptCodeExpression(output, importTexts),
    childInputDefinitions: [],
  };
}

export function writePothosArgFromDtoNestedField(
  field: ServiceOutputDtoNestedField,
  options: PothosDefinitionWriterOptions
): ArgOutput {
  const importTexts: string[] = [];
  let output = `'${field.nestedType.name}Input'`;
  if (field.isList) {
    output = `list(nonNull(${output}))`;
    importTexts.push("import {list} from 'pothos'");
  }
  if (!field.isOptional) {
    output = `nonNull(${output})`;
    importTexts.push("import {nonNull} from 'pothos'");
  }
  const { definition: childDefinition, childInputDefinitions } =
    writePothosInputDefinitionFromDtoFields(field.nestedType.fields, options);
  return {
    expression: new TypescriptCodeExpression(output, importTexts),
    childInputDefinitions: [
      { name: field.nestedType.name, definition: childDefinition },
      ...childInputDefinitions,
    ],
  };
}

export function writePothosArgsFromDtoFields(
  fields: ServiceOutputDtoField[],
  options: PothosDefinitionWriterOptions
): ArgOutput {
  const argOutputs = fields.map((field) => {
    if (field.type === 'nested') {
      return { [field.name]: writePothosArgFromDtoNestedField(field, options) };
    }
    return { [field.name]: writePothosArgFromDtoScalarField(field, options) };
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
