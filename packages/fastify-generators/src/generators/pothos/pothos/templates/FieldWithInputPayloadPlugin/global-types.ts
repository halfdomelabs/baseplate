// @ts-nocheck

import {
  FieldNullability,
  FieldRef,
  InputFieldMap,
  InputFieldRef,
  SchemaTypes,
  TypeParam,
  ShapeFromTypeParam,
  FieldKind,
} from '@pothos/core';
import {
  MutationWithInputPayloadOptions,
  OutputShapeFromFields,
} from './types';
import type { PothosFieldWithInputPayloadPlugin } from '.';

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
      ResolveReturnShape
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
      Kind extends FieldKind = FieldKind
    > {
      input: InputFieldBuilder<Types, 'InputObject'>;
      payload: RootFieldBuilder<Types, unknown, 'PayloadObject'>;
      fieldWithInputPayload: <
        InputFields extends Record<
          string,
          InputFieldRef<unknown, 'InputObject'>
        >,
        PayloadFields extends Record<
          string,
          FieldRef<unknown, 'PayloadObject'>
        >,
        ResolveShape,
        ResolveReturnShape,
        // eslint-disable-next-line @typescript-eslint/ban-types
        Args extends Record<string, InputFieldRef<unknown, 'Arg'>> = {}
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
        >
      ) => FieldRef<
        ShapeFromTypeParam<
          Types,
          ObjectRef<OutputShapeFromFields<PayloadFields>>,
          false
        >
      >;
    }
  }
}
