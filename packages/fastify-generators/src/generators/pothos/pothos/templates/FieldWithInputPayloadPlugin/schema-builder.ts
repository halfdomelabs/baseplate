// @ts-nocheck

import {
  InputFieldBuilder,
  ObjectFieldBuilder,
  RootFieldBuilder,
  SchemaTypes,
  FieldRef,
} from '@pothos/core';
import { capitalizeString } from '%ts-utils/string';

const rootBuilderProto: PothosSchemaTypes.RootFieldBuilder<
  SchemaTypes,
  unknown
> = RootFieldBuilder.prototype as PothosSchemaTypes.RootFieldBuilder<
  SchemaTypes,
  unknown
>;

rootBuilderProto.fieldWithInputPayload = function fieldWithInputPayload({
  args,
  input,
  payload,
  ...fieldOptions
}) {
  const inputRef =
    input && this.builder.inputRef(`UnamedInputOn${this.typename}`);

  const payloadRef = this.builder.objectRef(`UnamedPayloadOn${this.typename}`);

  // expose all fields of payload by default
  const payloadFields = (): Record<
    string,
    FieldRef<unknown, 'PayloadObject'>
  > => {
    Object.keys(payload).forEach((key) => {
      this.builder.configStore.onFieldUse(payload[key], (cfg) => {
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

  this.builder.configStore.onFieldUse(fieldRef, (config) => {
    const capitalizedName = capitalizeString(config.name);
    const inputName = `${capitalizedName}Input`;
    const payloadName = `${capitalizedName}Payload`;

    if (inputRef) {
      this.builder.inputType(inputName, {
        description: `Input type for ${config.name} mutation`,
        fields: () => input,
      } as never);

      this.builder.configStore.associateRefWithName(inputRef, inputName);
    }

    this.builder.objectType(payloadRef, {
      name: payloadName,
      description: `Payload type for ${config.name} mutation`,
      fields: payloadFields,
    });

    this.builder.configStore.associateRefWithName(payloadRef, payloadName);
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return fieldRef;
};

Object.defineProperty(rootBuilderProto, 'input', {
  get: function getInputBuilder(this: RootFieldBuilder<SchemaTypes, unknown>) {
    return new InputFieldBuilder(
      this.builder,
      'InputObject',
      `UnnamedWithInputOn${this.typename}`
    );
  },
});

Object.defineProperty(rootBuilderProto, 'payload', {
  get: function getPayloadBuilder(
    this: RootFieldBuilder<SchemaTypes, unknown>
  ) {
    return new ObjectFieldBuilder(
      `UnnamedWithPayloadOn${this.typename}`,
      this.builder
    );
  },
});
