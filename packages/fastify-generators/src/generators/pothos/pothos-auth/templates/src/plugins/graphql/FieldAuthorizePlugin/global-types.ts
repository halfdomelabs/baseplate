// @ts-nocheck

import type { PothosAuthorizeByRolesPlugin } from '$fieldAuthorizePlugin';
import type {
  AuthorizeRolePluginOptions,
  AuthorizeRoleRuleOption,
} from '$fieldAuthorizeTypes';
import type {
  FieldNullability,
  InputFieldMap,
  InputShapeFromFields,
  SchemaTypes,
  TypeParam,
} from '@pothos/core';

/* eslint-disable @typescript-eslint/no-unused-vars */

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace PothosSchemaTypes {
    export interface Plugins<Types extends SchemaTypes> {
      authorizeByRoles: PothosAuthorizeByRolesPlugin<Types>;
    }

    export interface UserSchemaTypes {
      AuthRole: string;
    }

    export interface ExtendDefaultTypes<
      PartialTypes extends Partial<UserSchemaTypes>,
    > {
      AuthRole: PartialTypes['AuthRole'] & string;
    }

    export interface SchemaBuilderOptions<Types extends SchemaTypes> {
      authorizeByRoles: AuthorizeRolePluginOptions<Types>;
    }

    export interface FieldOptions<
      Types extends SchemaTypes,
      ParentShape,
      Type extends TypeParam<Types>,
      Nullable extends FieldNullability<Type>,
      Args extends InputFieldMap,
      ResolveShape,
      ResolveReturnShape,
    > {
      authorize?: AuthorizeRoleRuleOption<
        ParentShape,
        InputShapeFromFields<Args>,
        Types
      >;
    }
  }
}
