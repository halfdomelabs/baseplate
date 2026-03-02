import type {
  FieldKind,
  FieldMap,
  FieldOptionsFromKind,
  FieldRef,
  GenericFieldRef,
  InputFieldMap,
  InputFieldRef,
  InputShapeFromFields,
  NullableToOptional,
  ObjectRef,
  SchemaTypes,
} from '@pothos/core';

export type PayloadFieldRef<Types extends SchemaTypes, T> = Omit<
  FieldRef<Types, T, 'PayloadObject'>,
  'validate'
>;

export type OutputShapeFromFields<Fields extends FieldMap> =
  NullableToOptional<{
    [K in keyof Fields]: Fields[K] extends GenericFieldRef<infer T> ? T : never;
  }>;

export type MutationWithInputPayloadOptions<
  Types extends SchemaTypes,
  ParentShape,
  Kind extends FieldKind,
  Args extends InputFieldMap,
  InputFields extends InputFieldMap,
  PayloadFields extends Record<string, PayloadFieldRef<Types, unknown>>,
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
