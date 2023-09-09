// @ts-nocheck

import { GraphQLResolveInfo } from 'graphql';
import { plugin } from 'nexus';
import { CreateFieldResolverInfo, NexusPlugin } from 'nexus/dist/plugin';
import { ArgsValue, GetGen, SourceValue } from 'nexus/dist/typegenTypeHelpers';
import { printedGenTyping, printedGenTypingImport } from 'nexus/dist/utils';
import { RequestServiceContext } from '%request-service-context';
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
  FieldName extends string,
> = (
  root: SourceValue<TypeName>,
  args: ArgsValue<TypeName, FieldName>,
  context: GetGen<'context'>,
  info: GraphQLResolveInfo,
) => boolean | Promise<boolean>;

export type FieldAuthorizeRule<
  TypeName extends string,
  FieldName extends string,
> = AuthRole | FieldAuthorizeRuleFunction<TypeName, FieldName>;

export type FieldAuthorizeRoleResolver<
  TypeName extends string,
  FieldName extends string,
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
  authorizeConfig: FieldAuthorizeRoleConfig = {},
): NexusPlugin => {
  const { requireOnRootFields } = authorizeConfig;

  async function authorizeAccess(
    authorize: FieldAuthorizeRoleResolver<string, string>,
    root: unknown,
    args: Record<string, unknown>,
    context: RequestServiceContext,
    info: GraphQLResolveInfo,
  ): Promise<void> {
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
      ruleFunctions.map((func) => func(root, args, context, info)),
    );

    // if any check passed, return success
    if (results.some((r) => r.status === 'fulfilled' && r.value === true)) {
      return;
    }

    // if a check threw an unexpected error, throw that since it may mean
    // the authorization rule may have been valid but failed to run
    const unexpectedError = results.find(
      (r) => r.status === 'rejected' && !(r.reason instanceof ForbiddenError),
    ) as PromiseRejectedResult;

    if (unexpectedError) {
      throw unexpectedError.reason;
    }
    throw new ForbiddenError('Forbidden');
  }

  return plugin({
    name: 'AuthorizeRole',
    description:
      'Plugin provides field-level authorization by role or function',
    fieldDefTypes,
    onCreateFieldResolver(
      config: CreateFieldResolverInfo<{
        authorize?: FieldAuthorizeRoleResolver<string, string>;
      }>,
    ) {
      const authorize = config.fieldConfig.extensions?.nexus?.config.authorize;

      // skip if authorize
      if (authorize == null) {
        if (
          requireOnRootFields &&
          ['Query', 'Mutation', 'Subscription'].includes(
            config.parentTypeConfig.name,
          )
        ) {
          throw new Error(
            `Authorize configuration required on root-field ${config.fieldConfig.name}`,
          );
        }
        return undefined;
      }

      return async (root, args: Record<string, unknown>, ctx, info, next) => {
        await authorizeAccess(
          authorize,
          root,
          args,
          ctx as RequestServiceContext,
          info,
        );

        return next(root, args, ctx, info);
      };
    },
    onAddOutputField(field) {
      const { authorize, subscribe } = field;

      // due to onFieldCreateSubscribe not being implemented (https://github.com/graphql-nexus/nexus/issues/868)
      // we need to manually patch subscribe field config
      if (subscribe && authorize) {
        // eslint-disable-next-line no-param-reassign
        field.subscribe = async function authorizeSubscribe(
          root,
          args: Record<string, unknown>,
          context,
          info,
        ) {
          await authorizeAccess(
            authorize,
            root,
            args,
            context as RequestServiceContext,
            info,
          );

          return subscribe(
            root,
            args,
            context,
            info,
          ) as AsyncIterableIterator<unknown>;
        };
      }
    },
  });
};
