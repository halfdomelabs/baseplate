import { TypescriptCodeBlock } from '@baseplate/core-generators';
import { ScalarFieldType } from '@src/types/fieldTypes';
import {
  ServiceOutputDtoField,
  ServiceOutputDtoNestedField,
  ServiceOutputDtoScalarField,
} from '@src/types/serviceOutput';
import { lowerCaseFirst } from '@src/utils/case';
import { NexusScalarConfig } from './scalars';

export interface NexusDefinitionWriterOptions {
  builder: string;
  lookupScalar: (name: ScalarFieldType) => NexusScalarConfig;
}

function writeNexusDefinitionFromDtoScalarField(
  field: ServiceOutputDtoScalarField,
  options: NexusDefinitionWriterOptions
): string {
  const components = [options.builder];

  if (!field.isOptional) {
    components.push('.nonNull');
  }

  if (field.isList) {
    components.push('.list.nonNull');
  }

  components.push(
    `.${options.lookupScalar(field.scalarType).nexusMethod}("${field.name}")`
  );

  return components.join('');
}

function writeNexusDefinitionFromDtoNestedField(
  field: ServiceOutputDtoNestedField,
  options: NexusDefinitionWriterOptions
): string {
  const components = [options.builder];

  if (!field.isOptional) {
    components.push('.nonNull');
  }

  if (field.isList) {
    components.push('.list.nonNull');
  }

  components.push(
    `.field("${field.name}", { type: '${field.nestedType.name}Input' })`
  );

  return components.join('');
}

export interface ChildInputDefinition {
  name: string;
  definition: string;
}

interface InputDefinition {
  definition: string;
  childInputDefinitions: ChildInputDefinition[];
}

export function writeNexusInputDefinitionFromDtoFields(
  fields: ServiceOutputDtoField[],
  options: NexusDefinitionWriterOptions
): InputDefinition {
  const inputDefinitions = fields.map((field) => {
    if (field.type === 'nested') {
      const { definition: childDefinition, childInputDefinitions } =
        writeNexusInputDefinitionFromDtoFields(
          field.nestedType.fields,
          options
        );
      return {
        definition: writeNexusDefinitionFromDtoNestedField(field, options),
        childInputDefinitions: [
          { name: field.nestedType.name, definition: childDefinition },
          ...childInputDefinitions,
        ],
      };
    }
    return {
      definition: writeNexusDefinitionFromDtoScalarField(field, options),
      childInputDefinitions: [],
    };
  });

  return {
    definition: inputDefinitions.map((d) => d.definition).join('\n'),
    childInputDefinitions: inputDefinitions.flatMap(
      (d) => d.childInputDefinitions
    ),
  };
}

export function writeScalarNexusDefinitionFromDtoFields(
  fields: ServiceOutputDtoField[],
  options: NexusDefinitionWriterOptions
): string {
  return fields
    .filter(
      (field): field is ServiceOutputDtoScalarField => field.type === 'scalar'
    )
    .map((field) => writeNexusDefinitionFromDtoScalarField(field, options))
    .join('\n');
}

const CHILD_INPUT_TYPE_TEMPLATE = `
export const INPUT_TYPE_EXPORT = inputObjectType({
  name: 'INPUT_TYPE_NAME',
  definition(t) {
INPUT_PAYLOAD
  },
});
`.trim();

export function writeChildInputDefinition(
  child: ChildInputDefinition
): TypescriptCodeBlock {
  const contents = CHILD_INPUT_TYPE_TEMPLATE.replace(
    'INPUT_TYPE_EXPORT',
    `${lowerCaseFirst(child.name)}Input`
  )
    .replace('INPUT_TYPE_NAME', `${child.name}Input`)
    .replace('INPUT_PAYLOAD', child.definition);
  return new TypescriptCodeBlock(
    contents,
    "import { inputObjectType } from 'nexus'"
  );
}
