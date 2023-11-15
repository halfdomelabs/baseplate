import {
  TypescriptCodeBlock,
  TypescriptCodeExpression,
} from '@halfdomelabs/core-generators';

import { NexusScalarConfig } from './scalars.js';
import { ScalarFieldType } from '@src/types/fieldTypes.js';
import {
  ServiceOutputDtoField,
  ServiceOutputDtoNestedField,
  ServiceOutputDtoScalarField,
} from '@src/types/serviceOutput.js';
import { lowerCaseFirst } from '@src/utils/case.js';

export interface NexusDefinitionWriterOptions {
  builder: string;
  lookupScalar: (name: ScalarFieldType) => NexusScalarConfig;
}

export function writeNexusObjectTypeFieldFromDtoNestedField(
  field: ServiceOutputDtoNestedField,
  resolver: TypescriptCodeExpression,
  options: NexusDefinitionWriterOptions,
): TypescriptCodeBlock {
  const components = [options.builder];

  if (!field.isOptional) {
    components.push('.nonNull');
  }

  if (field.isList) {
    components.push('.list.nonNull');
  }

  components.push(
    `.field("${field.name}", { type: '${field.nestedType.name}', resolve: RESOLVER })`,
  );

  const fieldStr = components.join('');
  return resolver
    .wrap((contents) => fieldStr.replace('RESOLVER', contents))
    .toBlock();
}

export function writeNexusDefinitionFromDtoScalarField(
  field: ServiceOutputDtoScalarField,
  options: NexusDefinitionWriterOptions,
): string {
  const components = [options.builder];

  if (!field.isOptional) {
    components.push('.nonNull');
  }

  if (field.isList) {
    components.push('.list.nonNull');
  }

  const { nexusMethod } = options.lookupScalar(field.scalarType);

  // prefer use of .id instead of .uuid for IDs
  const nexusMethodWithId =
    field.isId && (field.scalarType === 'uuid' || field.scalarType === 'string')
      ? 'id'
      : nexusMethod;

  if (!nexusMethodWithId) {
    if (field.scalarType !== 'enum' || !field.enumType) {
      throw new Error(`Field must have nexus type or be enum!`);
    }
    components.push(
      `.field("${field.name}", { type: "${field.enumType.name}" })`,
    );
  } else {
    components.push(`.${nexusMethodWithId}("${field.name}")`);
  }

  return components.join('');
}

function writeNexusInputDefinitionFromDtoNestedField(
  field: ServiceOutputDtoNestedField,
  options: NexusDefinitionWriterOptions,
): string {
  const components = [options.builder];

  if (!field.isOptional) {
    components.push('.nonNull');
  }

  if (field.isList) {
    components.push('.list.nonNull');
  }

  components.push(
    `.field("${field.name}", { type: '${
      field.schemaFieldName || `${field.nestedType.name}Input`
    }' })`,
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
  options: NexusDefinitionWriterOptions,
): InputDefinition {
  const inputDefinitions = fields.map((field) => {
    if (field.type === 'nested') {
      if (field.schemaFieldName) {
        return {
          definition: writeNexusInputDefinitionFromDtoNestedField(
            field,
            options,
          ),
          childInputDefinitions: [],
        };
      }

      if (field.isPrismaType) {
        throw new Error(`Prisma types not support in input types.`);
      }
      const { definition: childDefinition, childInputDefinitions } =
        writeNexusInputDefinitionFromDtoFields(
          field.nestedType.fields,
          options,
        );
      return {
        definition: writeNexusInputDefinitionFromDtoNestedField(field, options),
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
      (d) => d.childInputDefinitions,
    ),
  };
}

export function writeScalarNexusDefinitionFromDtoFields(
  fields: ServiceOutputDtoField[],
  options: NexusDefinitionWriterOptions,
): string {
  return fields
    .filter(
      (field): field is ServiceOutputDtoScalarField => field.type === 'scalar',
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
  child: ChildInputDefinition,
): TypescriptCodeBlock {
  const contents = CHILD_INPUT_TYPE_TEMPLATE.replace(
    'INPUT_TYPE_EXPORT',
    `${lowerCaseFirst(child.name)}Input`,
  )
    .replace('INPUT_TYPE_NAME', `${child.name}Input`)
    .replace('INPUT_PAYLOAD', child.definition);
  return new TypescriptCodeBlock(
    contents,
    "import { inputObjectType } from 'nexus'",
  );
}
