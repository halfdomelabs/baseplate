// @ts-nocheck

import type {
  AuthorizeRoleRuleFunction,
  AuthorizeRoleRuleOption,
} from '$fieldAuthorizeTypes';
import type { PothosOutputFieldConfig, SchemaTypes } from '@pothos/core';
import type { GraphQLFieldResolver, GraphQLResolveInfo } from 'graphql';

import { ForbiddenError } from '%errorHandlerServiceImports';
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
    authorize: AuthorizeRoleRuleOption<any, any, Types>,
    root: unknown,
    args: object,
    context: Types['Context'],
    info: GraphQLResolveInfo,
  ): Promise<void> {
    const rules = Array.isArray(authorize) ? authorize : [authorize];
    const roles = this.builder.options.authorizeByRoles.extractRoles(context);

    // process all string rules first
    const stringRules = rules.filter(
      (rule): rule is Types['AuthRole'] => typeof rule === 'string',
    );

    if (stringRules.some((rule) => roles.includes(rule))) {
      return;
    }

    const ruleFunctions = rules.filter(
      (rule): rule is AuthorizeRoleRuleFunction<unknown, unknown, Types> =>
        typeof rule === 'function',
    );

    // try all rules and see if any match
    const results = await Promise.allSettled(
      ruleFunctions.map((func) => func(root, args, context, info)),
    );

    // if any check passed, return success
    if (results.some((r) => r.status === 'fulfilled' && r.value)) {
      return;
    }

    // if a check threw an unexpected error, throw that since it may mean
    // the authorization rule may have been valid but failed to run
    const unexpectedError = results.find(
      (r) => r.status === 'rejected' && !(r.reason instanceof ForbiddenError),
    ) as PromiseRejectedResult | undefined;

    if (unexpectedError) {
      throw unexpectedError.reason;
    }

    // if a check threw a forbidden error with a message, throw that
    const forbiddenError = results.find(
      (r) => r.status === 'rejected' && r.reason instanceof ForbiddenError,
    ) as PromiseRejectedResult | undefined;

    if (forbiddenError) {
      throw forbiddenError.reason;
    }

    throw new ForbiddenError('Forbidden');
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
      await this.authorizeAccess(authorize, source, args, context, info);
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
      await this.authorizeAccess(authorize, source, args, context, info);
      return subscriber(source, args, context, info);
    };
  }
}

SchemaBuilder.registerPlugin(
  pothosAuthorizeByRolesPlugin,
  PothosAuthorizeByRolesPlugin,
);
