// @ts-nocheck

import { GraphQLResolveInfo } from 'graphql';
import { plugin } from 'nexus';
import { CreateFieldResolverInfo, NexusPlugin } from 'nexus/dist/plugin';
import { ArgsValue, GetGen, SourceValue } from 'nexus/dist/typegenTypeHelpers';
import { printedGenTyping, printedGenTypingImport } from 'nexus/dist/utils';
import { GraphQLContext } from '%nexus/context';
import { ForbiddenError } from '%http-errors';
import { AuthRole } from '%role-service';

// adapted from FieldAuthorizePlugin.ts in Nexus

const FieldAuthorizeRoleResolverImport = printedGenTypingImport({
  module: MODULE_FILE,
  bindings: ['FieldAuthorizeRoleResolver'],
});

const fieldDefTypes = printedGenTyping({
  optional: true,
  name: 'authorize',
  description: 'Authorization rules for an individual field',
  type: 'FieldAuthorizeRoleResolver<TypeName, FieldName>',
  imports: [FieldAuthorizeRoleResolverImport],
});

export type FieldAuthorizeRuleFunction<
  TypeName extends string,
  FieldName extends string
> = (
  root: SourceValue<TypeName>,
  args: ArgsValue<TypeName, FieldName>,
  context: GetGen<'context'>,
  info: GraphQLResolveInfo
) => boolean | Promise<boolean>;

export type FieldAuthorizeRule<
  TypeName extends string,
  FieldName extends string
> = AuthRole | FieldAuthorizeRuleFunction<TypeName, FieldName>;

export type FieldAuthorizeRoleResolver<
  TypeName extends string,
  FieldName extends string
> =
  | FieldAuthorizeRule<TypeName, FieldName>
  | FieldAuthorizeRule<TypeName, FieldName>[];

interface FieldAuthorizeRoleConfig {
  /**
   * Whether authorization is required on all root Query/Mutation fields
   */
  requireOnRootFields?: boolean;
}

export const fieldAuthorizeRolePlugin = (
  authorizeConfig: FieldAuthorizeRoleConfig = {}
): NexusPlugin => {
  const { requireOnRootFields } = authorizeConfig;

  return plugin({
    name: 'AuthorizeRole',
    description:
      'Plugin provides field-level authorization by role or function',
    fieldDefTypes,
    onCreateFieldResolver(
      config: CreateFieldResolverInfo<{
        authorize?: FieldAuthorizeRoleResolver<string, string>;
      }>
    ) {
      const authorize = config.fieldConfig.extensions?.nexus?.config.authorize;

      // skip if authorize
      if (authorize == null) {
        if (
          requireOnRootFields &&
          ['Query', 'Mutation'].includes(config.parentTypeConfig.name)
        ) {
          throw new Error(
            `Authorize configuration required on root-field ${config.fieldConfig.name}`
          );
        }
        return undefined;
      }
      return async (root, args: Record<string, unknown>, ctx, info, next) => {
        const context = ctx as GraphQLContext;
        const rules = Array.isArray(authorize) ? authorize : [authorize];

        const ruleFunctions: FieldAuthorizeRuleFunction<string, string>[] =
          rules.map((rule) => {
            if (typeof rule === 'function') {
              return rule;
            }
            return () => context.auth.roles.includes(rule);
          });

        // try all rules and see if any match
        const results = await Promise.allSettled(
          ruleFunctions.map((func) => func(root, args, context, info))
        );

        // if any check passed, move to next middleware
        if (results.some((r) => r.status === 'fulfilled' && r.value === true)) {
          return next(root, args, ctx, info);
        }

        // if a check threw an unexpected error, throw that since it may mean
        // the authorization rule may have been valid but failed to run
        const unexpectedError = results.find(
          (r) =>
            r.status === 'rejected' && !(r.reason instanceof ForbiddenError)
        ) as PromiseRejectedResult;

        if (unexpectedError) {
          throw unexpectedError.reason;
        }
        throw new ForbiddenError('Forbidden');
      };
    },
  });
};
