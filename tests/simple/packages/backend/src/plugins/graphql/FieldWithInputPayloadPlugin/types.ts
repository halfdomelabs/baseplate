import {
  ArgumentRef,
  FieldKind,
  FieldMap,
  FieldOptionsFromKind,
  FieldRef,
  GenericFieldRef,
  InputFieldRef,
  InputShapeFromFields,
  NullableToOptional,
  ObjectRef,
  SchemaTypes,
} from '@pothos/core';

export type OutputShapeFromFields<Fields extends FieldMap> =
  NullableToOptional<{
    [K in keyof Fields]: Fields[K] extends GenericFieldRef<infer T> ? T : never;
  }>;

export type MutationWithInputPayloadOptions<
  Types extends SchemaTypes,
  ParentShape,
  Kind extends FieldKind,
  Args extends Record<string, ArgumentRef<Types, unknown>>,
  InputFields extends Record<string, InputFieldRef<Types, unknown>>,
  PayloadFields extends Record<string, FieldRef<Types, unknown, 'Object'>>,
  ResolveShape,
  ResolveReturnShape,
> = Omit<
  FieldOptionsFromKind<
    Types,
    ParentShape,
    ObjectRef<Types, OutputShapeFromFields<PayloadFields>>,
    false,
    {
      input: InputFieldRef<Types, InputShapeFromFields<InputFields>>;
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
