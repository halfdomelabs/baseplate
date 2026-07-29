import type { FieldRef, SchemaTypes } from '@pothos/core';

import {
  InputFieldBuilder,
  ObjectFieldBuilder,
  RootFieldBuilder,
} from '@pothos/core';

import { capitalizeString } from '@src/utils/string.js';

import type { PayloadFieldRef } from './types.js';

/**
 * Builds the mutation field and normalizes its type. The casts sit behind
 * fixed parameter types because `field()`'s option and return types shift with
 * the enabled Pothos plugins; written inline they would be flagged as
 * unnecessary in projects whose plugin set makes them redundant.
 */
function defineMutationField(
  builder: { field: (options: never) => unknown },
  options: object,
): FieldRef<SchemaTypes, never, 'Mutation'> {
  return builder.field(options as never) as FieldRef<
    SchemaTypes,
    never,
    'Mutation'
  >;
}

const rootBuilderProto =
  RootFieldBuilder.prototype as PothosSchemaTypes.RootFieldBuilder<
    SchemaTypes,
    unknown
  >;

rootBuilderProto.fieldWithInputPayload = function fieldWithInputPayload({
  args,
  input,
  payload,
  ...fieldOptions
}) {
  const inputRef = input && this.builder.inputRef(`UnnamedWithInputPayload`);

  const payloadRef = this.builder.objectRef(`UnnamedWithInputPayload`);

  // expose all fields of payload by default
  const payloadFields = (): Record<
    string,
    PayloadFieldRef<SchemaTypes, unknown>
  > => {
    for (const [key, fieldRef] of Object.entries(payload)) {
      fieldRef.onFirstUse((cfg) => {
        if (cfg.kind === 'Object' && !cfg.resolve) {
          cfg.resolve = (parent) => (parent as Record<string, unknown>)[key];
        }
      });
    }

    return payload;
  };

  const fieldRef = defineMutationField(this, {
    args: {
      ...args,
      ...(inputRef
        ? {
            input: this.arg({
              required: true,
              type: inputRef,
            }),
          }
        : {}),
    },
    type: payloadRef,
    nullable: false,
    ...fieldOptions,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fieldRef.onFirstUse((config: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    const capitalizedName = capitalizeString(config.name);
    const inputName = `${capitalizedName}Input`;
    const payloadName = `${capitalizedName}Payload`;

    if (inputRef) {
      inputRef.name = inputName;
      this.builder.inputType(inputRef, {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        description: `Input type for ${config.name} mutation`,
        fields: () => input,
      });
    }

    payloadRef.name = payloadName;
    this.builder.objectType(payloadRef, {
      name: payloadName,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      description: `Payload type for ${config.name} mutation`,
      fields: payloadFields,
    });
  });

  return fieldRef;
};

Object.defineProperty(rootBuilderProto, 'input', {
  get: function getInputBuilder(this: RootFieldBuilder<SchemaTypes, unknown>) {
    return new InputFieldBuilder(this.builder, 'InputObject');
  },
});

Object.defineProperty(rootBuilderProto, 'payload', {
  get: function getPayloadBuilder(
    this: RootFieldBuilder<SchemaTypes, unknown>,
  ) {
    return new ObjectFieldBuilder(this.builder);
  },
});
