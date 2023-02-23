// @ts-nocheck

import {
  FieldKind,
  FieldMap,
  FieldOptionsFromKind,
  FieldRef,
  InputFieldRef,
  InputShapeFromFields,
  NullableToOptional,
  ObjectRef,
  SchemaTypes,
} from '@pothos/core';

export type OutputShapeFromFields<Fields extends FieldMap> =
  NullableToOptional<{
    [K in keyof Fields]: Fields[K] extends FieldRef<infer T> ? T : never;
  }>;

export type MutationWithInputPayloadOptions<
  Types extends SchemaTypes,
  ParentShape,
  Kind extends FieldKind,
  Args extends Record<string, InputFieldRef<unknown, 'Arg'>>,
  InputFields extends Record<string, InputFieldRef<unknown, 'InputObject'>>,
  PayloadFields extends Record<string, FieldRef<unknown, 'Object'>>,
  ResolveShape,
  ResolveReturnShape
> = Omit<
  FieldOptionsFromKind<
    Types,
    ParentShape,
    ObjectRef<OutputShapeFromFields<PayloadFields>>,
    false,
    {
      input: InputFieldRef<InputShapeFromFields<InputFields>>;
    } & Args,
    Kind,
    ResolveShape,
    ResolveReturnShape
  >,
  'args' | 'type'
> & {
  input?: InputFields;
  payload: PayloadFields;
  args?: Args;
};
