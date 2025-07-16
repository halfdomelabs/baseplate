// @ts-nocheck

import type { PothosFieldWithInputPayloadPlugin } from '$fieldWithInputPlugin';
import type {
  MutationWithInputPayloadOptions,
  OutputShapeFromFields,
} from '$fieldWithInputTypes';
import type {
  ArgumentRef,
  FieldKind,
  FieldNullability,
  FieldRef,
  InputFieldMap,
  InputFieldRef,
  SchemaTypes,
  ShapeFromTypeParam,
  TypeParam,
} from '@pothos/core';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace PothosSchemaTypes {
    export interface Plugins<Types extends SchemaTypes> {
      fieldWithInputPayload: PothosFieldWithInputPayloadPlugin<Types>;
    }

    export interface PothosKindToGraphQLType {
      PayloadObject: 'Object';
    }

    export interface FieldOptionsByKind<
      Types extends SchemaTypes,
      ParentShape,
      Type extends TypeParam<Types>,
      Nullable extends FieldNullability<Type>,
      Args extends InputFieldMap,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ResolveShape,
      ResolveReturnShape,
    > {
      PayloadObject: Omit<
        ObjectFieldOptions<
          Types,
          ParentShape,
          Type,
          Nullable,
          Args,
          ResolveReturnShape
        >,
        'resolve'
      >;
    }

    export interface RootFieldBuilder<
      Types extends SchemaTypes,
      ParentShape,
      Kind extends FieldKind = FieldKind,
    > {
      input: InputFieldBuilder<Types, 'InputObject'>;
      payload: RootFieldBuilder<Types, unknown, 'PayloadObject'>;
      fieldWithInputPayload: <
        InputFields extends Record<string, InputFieldRef<Types>>,
        PayloadFields extends Record<
          string,
          FieldRef<Types, unknown, 'PayloadObject'>
        >,
        ResolveShape,
        ResolveReturnShape,
        Args extends Record<string, ArgumentRef<Types>> = Record<never, never>,
      >(
        options: MutationWithInputPayloadOptions<
          Types,
          ParentShape,
          Kind,
          Args,
          InputFields,
          PayloadFields,
          ResolveShape,
          ResolveReturnShape
        >,
      ) => FieldRef<
        Types,
        ShapeFromTypeParam<
          Types,
          ObjectRef<Types, OutputShapeFromFields<PayloadFields>>,
          false
        >
      >;
    }
  }
}
