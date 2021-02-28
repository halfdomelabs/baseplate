/* eslint-disable @typescript-eslint/unbound-method */
import {
  FieldResolver,
  inputObjectType,
  nonNull,
  objectType,
  queryField,
  core,
  list,
  mutationField,
} from 'nexus';
import { FieldAuthorizeResolver } from 'nexus/dist/plugins/fieldAuthorizePlugin';

function capitalizeFirstLetter(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

type InputType<
  QueryFieldName extends string
> = `${Capitalize<QueryFieldName>}Input`;
type PayloadType<
  QueryFieldName extends string
> = `${Capitalize<QueryFieldName>}Payload`;

interface ListQueryFieldConfig<QueryFieldName extends string> {
  description?: string;
  authorize?: FieldAuthorizeResolver<'Query', QueryFieldName>;
  objectType: core.NexusNonNullableTypes;
  extraPayloadDefinition?(
    t: core.ObjectDefinitionBlock<PayloadType<QueryFieldName>>
  ): void;
  args?: core.ArgsRecord;
  resolve: FieldResolver<'Query', QueryFieldName>;
}

export function createListQueryField<QueryFieldName extends string>(
  name: QueryFieldName,
  config: ListQueryFieldConfig<QueryFieldName>
): unknown[] {
  const capitalizedName = capitalizeFirstLetter(name);

  const payload = objectType({
    name: `${capitalizedName}Payload`,
    description: `Payload type for the ${name} query`,
    definition: (t) => {
      t.field('nodes', {
        type: nonNull(list(nonNull(config.objectType))),
      });
      if (config.extraPayloadDefinition) {
        config.extraPayloadDefinition(
          t as core.ObjectDefinitionBlock<PayloadType<QueryFieldName>>
        );
      }
    },
  });

  const field = queryField(name as string, {
    description: config.description,
    authorize: config.authorize as FieldAuthorizeResolver<'Query', string>,
    type: payload,
    args: config.args,
    // I tried to fix the typings but it is hard...
    resolve: (config.resolve as unknown) as FieldResolver<'Query', string>,
  });
  return [payload, field];
}

interface MutationFieldConfig<MutationFieldName extends string> {
  description?: string;
  authorize?: FieldAuthorizeResolver<'Mutation', MutationFieldName>;
  payloadDefinition(
    t: core.ObjectDefinitionBlock<PayloadType<MutationFieldName>>
  ): void;
  inputDefinition(
    t: core.InputDefinitionBlock<InputType<MutationFieldName>>
  ): void;
  resolve: FieldResolver<'Mutation', MutationFieldName>;
}

export function createMutationField<MutationFieldName extends string>(
  name: MutationFieldName,
  config: MutationFieldConfig<MutationFieldName>
): unknown[] {
  const capitalizedName = capitalizeFirstLetter(name);

  const input = inputObjectType({
    name: `${capitalizedName}Input` as InputType<MutationFieldName>,
    description: `Input type for the ${name} mutation`,
    definition: config.inputDefinition,
  });
  const payload = objectType({
    name: `${capitalizedName}Payload`,
    description: `Payload type for the ${name} mutation`,
    definition: config.payloadDefinition as (
      t: core.ObjectDefinitionBlock<string>
    ) => void,
  });

  const field = mutationField(name as string, {
    description: config.description,
    authorize: config.authorize as FieldAuthorizeResolver<'Mutation', string>,
    type: payload,
    args: { input: nonNull(input) },
    // I tried to fix the typings but it is hard...
    resolve: (config.resolve as unknown) as FieldResolver<'Mutation', string>,
  });
  return [input, payload, field];
}
