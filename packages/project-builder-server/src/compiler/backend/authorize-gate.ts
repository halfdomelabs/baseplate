/**
 * Derives the coarse GraphQL `authorize` gate for a field's role grant.
 *
 * The gate is a flat list of global role names checked before the resolver runs,
 * so it cannot evaluate a per-row (instance) grant — row-level filtering is left
 * to the model policy's `where`/`whereUnique`.
 */

import type { ModelConfig } from '@baseplate-dev/project-builder-lib';
import type { GeneratorBundle } from '@baseplate-dev/sync';

import { pothosAuthorizeFieldGenerator } from '@baseplate-dev/fastify-generators';
import {
  authConfigSpec,
  parseAuthorizerExpression,
  visitAuthorizerExpression,
} from '@baseplate-dev/project-builder-lib';
import { uniq } from 'es-toolkit';

import type { BackendAppEntryBuilder } from '../app-entry-builder.js';

/**
 * The built-in role auto-assigned to every caller, authenticated or not.
 * A gate containing it admits anyone.
 */
const PUBLIC_ROLE_NAME = 'public';

/**
 * The built-in role assigned only by `createSystemAuthContext()` for background
 * jobs, which never reach a resolver — so no GraphQL caller can hold it.
 */
const SYSTEM_ROLE_NAME = 'system';

/**
 * The built-in role auto-assigned to every authenticated caller. A gate
 * containing it admits any logged-in user, so it subsumes every other role.
 */
const AUTHENTICATED_ROLE_NAME = 'user';

/**
 * Roles a derived gate must never name: `public` would reopen it to
 * unauthenticated callers, and `system` can never be a GraphQL caller. Both
 * remain usable when a grant names them explicitly as a global role.
 */
const NON_CALLER_ROLE_NAMES = new Set([PUBLIC_ROLE_NAME, SYSTEM_ROLE_NAME]);

/** A field's role grant, as authored on a query or service method. */
interface RoleGrant {
  globalRoles: string[];
  instanceRoles: string[];
}

/**
 * The weakest principal an instance-role expression could be satisfied by.
 * `'authenticated'` needs a user session; `'anonymous'` may match any caller
 * (a literal-only comparison such as `model.isPublic === true`); a role name
 * means only holders of that global role can satisfy it.
 */
export type InstanceRoleFloor =
  | { kind: 'anonymous' }
  | { kind: 'authenticated' }
  | { kind: 'globalRoles'; roles: string[] };

/** Either branch can grant, so the weaker requirement wins. */
function weaker(a: InstanceRoleFloor, b: InstanceRoleFloor): InstanceRoleFloor {
  if (a.kind === 'anonymous' || b.kind === 'anonymous') {
    return { kind: 'anonymous' };
  }
  if (a.kind === 'authenticated' || b.kind === 'authenticated') {
    return { kind: 'authenticated' };
  }
  return { kind: 'globalRoles', roles: [...a.roles, ...b.roles] };
}

/** Both branches must hold, so the stronger requirement wins. */
function stronger(
  a: InstanceRoleFloor,
  b: InstanceRoleFloor,
): InstanceRoleFloor {
  if (a.kind === 'globalRoles') return a;
  if (b.kind === 'globalRoles') return b;
  if (a.kind === 'authenticated' || b.kind === 'authenticated') {
    return { kind: 'authenticated' };
  }
  return { kind: 'anonymous' };
}

/**
 * Derives the weakest principal that could satisfy an authorizer expression,
 * used to size the gate for a grant that names instance roles.
 *
 * @throws if the expression cannot be parsed.
 */
export function deriveInstanceRoleFloor(expression: string): InstanceRoleFloor {
  let parsed;
  try {
    parsed = parseAuthorizerExpression(expression);
  } catch (error) {
    throw new Error(
      `Could not derive an authorize gate from authorizer expression \`${expression}\`: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { cause: error },
    );
  }

  return visitAuthorizerExpression<InstanceRoleFloor>(parsed.ast, {
    // Only an `auth.*` reference binds the expression to a session; comparing
    // a model field to a literal can match for any caller.
    fieldComparison: (node) =>
      [node.left, node.right].some(
        (side) => side.type === 'fieldRef' && side.source === 'auth',
      )
        ? { kind: 'authenticated' }
        : { kind: 'anonymous' },
    hasRole: (node) => ({ kind: 'globalRoles', roles: [node.role] }),
    hasSomeRole: (node) => ({ kind: 'globalRoles', roles: node.roles }),
    nestedHasRole: () => ({ kind: 'authenticated' }),
    nestedHasSomeRole: () => ({ kind: 'authenticated' }),
    relationFilter: (node) =>
      node.conditions.some(
        (condition) =>
          condition.value.type === 'fieldRef' &&
          condition.value.source === 'auth',
      )
        ? { kind: 'authenticated' }
        : { kind: 'anonymous' },
    isAuthenticated: () => ({ kind: 'authenticated' }),
    binaryLogical: (node, _ctx, visit) =>
      (node.operator === '||' ? weaker : stronger)(
        visit(node.left),
        visit(node.right),
      ),
  });
}

/** Role data the resolution needs, supplied by the caller. */
interface RoleGateResolvers {
  /** Resolve a global role id ref to its name. */
  globalRoleName: (roleRef: string) => string;
  /**
   * The floor for one of the model's authorizer roles, or `undefined` when the
   * model declares no role by that name.
   */
  instanceRoleFloor: (roleName: string) => InstanceRoleFloor | undefined;
  /** Roles a logged-in caller may hold. */
  authenticatedRoleNames: () => string[];
  /** Roles any caller may hold, including unauthenticated ones. */
  allAuthRoleNames: () => string[];
}

/**
 * Resolves the role names for a field's coarse `authorize` gate.
 * - No roles → no gate (public)
 * - Only global roles → those roles
 * - Instance roles present → the grant's own global roles plus the weakest
 *   principal any instance role could be satisfied by, collapsed to the single
 *   role that subsumes the rest.
 */
export function resolveCoarseAuthorizeRoles(
  grant: RoleGrant,
  resolvers: RoleGateResolvers,
): string[] | undefined {
  const { globalRoles, instanceRoles } = grant;

  if (globalRoles.length === 0 && instanceRoles.length === 0) {
    return undefined;
  }

  const globalRoleNames = globalRoles.map((r) => resolvers.globalRoleName(r));

  if (instanceRoles.length === 0) {
    return globalRoleNames;
  }

  const floors = instanceRoles.map((roleName) =>
    resolvers.instanceRoleFloor(roleName),
  );

  // A grant naming a role the model does not declare could be satisfied by
  // anyone, so widen rather than silently locking callers out.
  const floorRoleNames = floors.flatMap((floor) => {
    switch (floor?.kind) {
      case 'globalRoles': {
        return floor.roles;
      }
      case 'authenticated': {
        return resolvers.authenticatedRoleNames();
      }
      default: {
        return resolvers.allAuthRoleNames();
      }
    }
  });

  const roles = uniq([...globalRoleNames, ...floorRoleNames]);

  if (roles.length === 0) {
    return undefined;
  }

  // `authorize` is an OR, so an auto-assigned role subsumes every role it is
  // granted alongside: `public` is held by everyone, `user` by every
  // authenticated caller. Collapse to the widest one present.
  const subsumingRole = [PUBLIC_ROLE_NAME, AUTHENTICATED_ROLE_NAME].find(
    (name) => roles.includes(name),
  );
  return subsumingRole ? [subsumingRole] : roles;
}

/**
 * Builds the coarse `authorize` gate bundle for a field's role grant, or
 * `undefined` when the grant names no roles (leaving the field public).
 */
function deriveCoarseAuthorize(
  appBuilder: BackendAppEntryBuilder,
  model: ModelConfig,
  grant: RoleGrant,
): GeneratorBundle | undefined {
  const getAuthRoleNames = (): string[] => {
    const authConfig =
      appBuilder.definitionContainer.pluginStore.use(authConfigSpec);
    const roles =
      authConfig.getAuthConfig(appBuilder.projectDefinition)?.roles ?? [];
    return roles.map((r) => r.name);
  };

  const roles = resolveCoarseAuthorizeRoles(grant, {
    globalRoleName: (roleRef) => appBuilder.nameFromId(roleRef),
    instanceRoleFloor: (roleName) => {
      const authorizerRole = model.authorizer.roles.find(
        (r) => r.id === roleName || r.name === roleName,
      );
      return authorizerRole
        ? deriveInstanceRoleFloor(authorizerRole.expression)
        : undefined;
    },
    authenticatedRoleNames: () =>
      getAuthRoleNames().filter((name) => !NON_CALLER_ROLE_NAMES.has(name)),
    // An anonymously-satisfiable role admits everyone, so `public` belongs
    // here; `system` still cannot be a GraphQL caller.
    allAuthRoleNames: () =>
      getAuthRoleNames().filter((name) => name !== SYSTEM_ROLE_NAME),
  });

  return roles ? pothosAuthorizeFieldGenerator({ roles }) : undefined;
}

/** The gate shared by a model's get/list/count/connection read fields. */
export function deriveQueryAuthorize(
  appBuilder: BackendAppEntryBuilder,
  model: ModelConfig,
  isAuthEnabled: boolean,
): GeneratorBundle | undefined {
  if (!isAuthEnabled) {
    return undefined;
  }

  const { queries } = model.graphql;

  return deriveCoarseAuthorize(appBuilder, model, {
    globalRoles: queries.globalRoles,
    instanceRoles: queries.instanceRoles,
  });
}

/**
 * The gate for one mutation, from its service method's roles.
 * `service.create` has no `instanceRoles` in the schema, hence the default.
 */
export function deriveMutationAuthorize(
  appBuilder: BackendAppEntryBuilder,
  model: ModelConfig,
  serviceMethod: { globalRoles: string[]; instanceRoles?: string[] },
  isAuthEnabled: boolean,
): GeneratorBundle | undefined {
  if (!isAuthEnabled) {
    return undefined;
  }

  return deriveCoarseAuthorize(appBuilder, model, {
    globalRoles: serviceMethod.globalRoles,
    instanceRoles: serviceMethod.instanceRoles ?? [],
  });
}
