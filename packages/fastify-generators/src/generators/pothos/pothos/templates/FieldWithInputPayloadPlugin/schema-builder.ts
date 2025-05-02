// @ts-nocheck

import { capitalizeString } from '%tsUtilsImports';
import {
  FieldRef,
  InputFieldBuilder,
  ObjectFieldBuilder,
  RootFieldBuilder,
  SchemaTypes,
} from '@pothos/core';

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
    FieldRef<SchemaTypes, unknown, 'PayloadObject'>
  > => {
    Object.keys(payload).forEach((key) => {
      payload[key].onFirstUse((cfg) => {
        if (cfg.kind === 'Object') {
          // eslint-disable-next-line no-param-reassign
          cfg.resolve = (parent) =>
            (parent as Record<string, unknown>)[key] as Readonly<unknown>;
        }
      });
    });

    return payload;
  };

  const fieldRef = this.field({
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
  } as never);

  fieldRef.onFirstUse((config) => {
    const capitalizedName = capitalizeString(config.name);
    const inputName = `${capitalizedName}Input`;
    const payloadName = `${capitalizedName}Payload`;

    if (inputRef) {
      inputRef.name = inputName;
      this.builder.inputType(inputRef, {
        description: `Input type for ${config.name} mutation`,
        fields: () => input,
      });
    }

    payloadRef.name = payloadName;
    this.builder.objectType(payloadRef, {
      name: payloadName,
      description: `Payload type for ${config.name} mutation`,
      fields: payloadFields,
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return fieldRef;
};

Object.defineProperty(rootBuilderProto, 'input', {
  get: function getInputBuilder(this: RootFieldBuilder<SchemaTypes, unknown>) {
    return new InputFieldBuilder(
      this.builder,
      'InputObject',
      `UnnamedWithInputPayload`,
    );
  },
});

Object.defineProperty(rootBuilderProto, 'payload', {
  get: function getPayloadBuilder(
    this: RootFieldBuilder<SchemaTypes, unknown>,
  ) {
    return new ObjectFieldBuilder(this.builder);
  },
});
