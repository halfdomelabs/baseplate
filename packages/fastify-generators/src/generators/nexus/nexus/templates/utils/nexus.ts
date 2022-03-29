// @ts-nocheck

import {
  arg,
  FieldResolver,
  inputObjectType,
  mutationField,
  nonNull,
  objectType,
} from 'nexus';
import { InputDefinitionBlock, OutputDefinitionBlock } from 'nexus/dist/blocks';

export type NexusType = unknown;

type CapitalizedInput<FieldName extends string> =
  `${Capitalize<FieldName>}Input`;
type CapitalizedPayload<FieldName extends string> =
  `${Capitalize<FieldName>}Payload`;

interface CreateMutationOptions<FieldName extends string> {
  name: FieldName;
  inputDefinition?: (
    t: InputDefinitionBlock<CapitalizedInput<FieldName>>
  ) => void;
  payloadDefinition: (
    t: OutputDefinitionBlock<CapitalizedPayload<FieldName>>
  ) => void;
  resolve: FieldResolver<'Mutation', FieldName>;
  CUSTOM_CREATE_MUTATION_OPTIONS;
}

/**
 * Creates a standard mutation with the following structure
 * mutation(input: MutationInput): MutationPayload
 *
 * @param options Options for the mutation
 * @returns An array with the created types
 */
export function createStandardMutation<FieldName extends string>({
  name,
  inputDefinition,
  payloadDefinition,
  resolve, // CUSTOM_MUTATION_FIELDS
}: CreateMutationOptions<FieldName>): NexusType[] {
  const inputName = `${CAPITALIZE_STRING(
    name
  )}Input` as CapitalizedInput<FieldName>;
  const inputType =
    inputDefinition &&
    inputObjectType({
      name: inputName,
      description: `Input type for ${name} mutation`,
      definition: inputDefinition,
    });

  const payloadName = `${CAPITALIZE_STRING(
    name
  )}Payload` as CapitalizedPayload<FieldName>;
  const payloadType = objectType({
    name: payloadName,
    description: `Payload type for ${name} mutation`,
    definition: payloadDefinition,
  });

  const mutationType = mutationField((t) => {
    t.field(name, {
      args: inputType
        ? {
            input: arg({ type: nonNull(inputType) }),
          }
        : {},
      type: payloadType,
      resolve, // CUSTOM_MUTATION_FIELDS
    });
  });

  return [...(inputType ? [inputType] : []), payloadType, mutationType];
}
