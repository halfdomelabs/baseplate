import type {
  FieldKind,
  FieldNullability,
  InputFieldMap,
  SchemaTypes,
  ShapeFromTypeParam,
  TypeParam,
} from '@pothos/core';

import type { PothosFieldWithInputPayloadPlugin } from './index.js';
import type {
  MutationWithInputPayloadOptions,
  OutputShapeFromFields,
} from './types.js';

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
        InputFields extends InputFieldMap,
        PayloadFields extends Record<
          string,
          FieldRef<Types, unknown, 'PayloadObject'>
        >,
        ResolveShape,
        ResolveReturnShape,
        Args extends InputFieldMap = Record<never, never>,
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
