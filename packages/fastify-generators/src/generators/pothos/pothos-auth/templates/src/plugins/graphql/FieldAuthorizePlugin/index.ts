// @ts-nocheck

import type { AuthorizeRoleRuleOption } from '$fieldAuthorizeTypes';
import type { ServiceContext } from '%serviceContextImports';
import type { PothosOutputFieldConfig, SchemaTypes } from '@pothos/core';
import type { GraphQLFieldResolver } from 'graphql';

import { checkInstanceAuthorization } from '%authorizerUtilsImports';
import SchemaBuilder, { BasePlugin } from '@pothos/core';

import './global-types.js';

export const pothosAuthorizeByRolesPlugin = 'authorizeByRoles';

export class PothosAuthorizeByRolesPlugin<
  Types extends SchemaTypes,
> extends BasePlugin<Types> {
  override onOutputFieldConfig(
    fieldConfig: PothosOutputFieldConfig<Types>,
  ): PothosOutputFieldConfig<Types> | null {
    const { authorize } = fieldConfig.pothosOptions;

    if (
      !authorize &&
      ['Query', 'Mutation', 'Subscription'].includes(fieldConfig.parentType) &&
      this.builder.options.authorizeByRoles.requireOnRootFields
    ) {
      throw new Error(
        `Field "${fieldConfig.parentType}.${fieldConfig.name}" is missing an "authorize" option and all root fields require authorization.`,
      );
    }

    return fieldConfig;
  }

  async authorizeAccess(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    authorize: AuthorizeRoleRuleOption<any>,
    root: unknown,
    context: Types['Context'],
  ): Promise<void> {
    const rules = Array.isArray(authorize) ? authorize : [authorize];
    const ctx = context as ServiceContext;

    await checkInstanceAuthorization(ctx, root, rules);
  }

  override wrapResolve(
    resolver: GraphQLFieldResolver<unknown, Types['Context'], object>,
    fieldConfig: PothosOutputFieldConfig<Types>,
  ): GraphQLFieldResolver<unknown, Types['Context'], object> {
    const { authorize } = fieldConfig.pothosOptions;
    if (!authorize) {
      return resolver;
    }

    return async (source, args, context, info) => {
      await this.authorizeAccess(authorize, source, context);
      return resolver(source, args, context, info);
    };
  }

  override wrapSubscribe(
    subscriber: GraphQLFieldResolver<unknown, Types['Context'], object>,
    fieldConfig: PothosOutputFieldConfig<Types>,
  ): GraphQLFieldResolver<unknown, Types['Context'], object> {
    const { authorize } = fieldConfig.pothosOptions;
    if (!authorize) {
      return subscriber;
    }

    return async (source, args, context, info) => {
      await this.authorizeAccess(authorize, source, context);
      return subscriber(source, args, context, info);
    };
  }
}

SchemaBuilder.registerPlugin(
  pothosAuthorizeByRolesPlugin,
  PothosAuthorizeByRolesPlugin,
);
