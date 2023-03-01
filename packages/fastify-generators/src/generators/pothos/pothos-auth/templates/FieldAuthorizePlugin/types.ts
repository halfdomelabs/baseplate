// @ts-nocheck

import { SchemaTypes } from '@pothos/core';
import { GraphQLResolveInfo } from 'graphql';

export type AuthorizeRoleRuleFunction<
  RootType,
  ArgsType,
  Types extends SchemaTypes
> = (
  root: RootType,
  args: ArgsType,
  context: Types['Context'],
  info: GraphQLResolveInfo
) => boolean | Promise<boolean>;

export type AuthorizeRoleRule<RootType, ArgsType, Types extends SchemaTypes> =
  | Types['AuthRole']
  | AuthorizeRoleRuleFunction<RootType, ArgsType, Types>;

export type AuthorizeRoleRuleOption<
  RootType,
  ArgsType,
  Types extends SchemaTypes
> =
  | AuthorizeRoleRule<RootType, ArgsType, Types>
  | AuthorizeRoleRule<RootType, ArgsType, Types>[];

export type AuthorizeRolePluginOptions<Types extends SchemaTypes> = {
  requireOnRootFields?: boolean;
  extractRoles: (context: Types['Context']) => Types['AuthRole'][];
};
