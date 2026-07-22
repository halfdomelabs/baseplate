import type { Prisma, PrismaClient } from '../generated/prisma/client.js';
import type { AuthRole } from '../modules/accounts/auth/constants/auth-roles.constants.js';
import type {
  GetResult,
  ModelPropName,
  WhereInput,
  WhereUniqueInput,
} from './data-operations/prisma-types.js';
import type { WhereResult } from './query-helpers.js';
import type { ServiceContext } from './service-context.js';

import { ForbiddenError } from './http-errors.js';
import { queryHelpers } from './query-helpers.js';

// ============================================================================
// Field-gate rules (consumed by the GraphQL FieldAuthorizePlugin)
// ----------------------------------------------------------------------------
// A field `authorize:` rule is either a GLOBAL role (a string, checked via
// `ctx.auth.hasSomeRole`) or an INSTANCE check — a `(ctx, model) => boolean`.
// A policy role's `.check` member satisfies `InstanceRoleCheck` exactly, so a
// field gate reads `authorize: ['admin', userPolicy.roles.self.check]`.
// ============================================================================

/** A global-role field-gate rule — a role string. */
export type GlobalRoleCheck = AuthRole;

/** An instance field-gate rule — satisfied by `policy.roles.<name>.check`. */
export type InstanceRoleCheck<TInstance> = (
  ctx: ServiceContext,
  instance: TInstance,
) => Promise<boolean> | boolean;

/** Throw unless the principal holds one of the global roles. */
export function checkGlobalAuthorization(
  ctx: ServiceContext,
  authorize: AuthRole[],
): void {
  if (!ctx.auth.hasSomeRole(authorize)) {
    throw new ForbiddenError('Forbidden');
  }
}

/**
 * OR of field-gate rules: global roles (strings) checked first via
 * `hasSomeRole`, then instance checks (functions) run sequentially with lazy
 * instance loading. Throws `ForbiddenError` if none pass.
 */
export async function checkInstanceAuthorization<T>(
  ctx: ServiceContext,
  instance: T | (() => Promise<T>),
  authorize: (InstanceRoleCheck<T> | AuthRole)[],
): Promise<void> {
  const globalRoles = authorize.filter(
    (check): check is AuthRole => typeof check === 'string',
  );
  const instanceChecks = authorize.filter(
    (check): check is InstanceRoleCheck<T> => typeof check === 'function',
  );

  if (globalRoles.length > 0 && ctx.auth.hasSomeRole(globalRoles)) {
    return;
  }

  if (instanceChecks.length > 0) {
    const resolvedInstance =
      typeof instance === 'function'
        ? await (instance as () => Promise<T>)()
        : instance;

    for (const check of instanceChecks) {
      if (await check(ctx, resolvedInstance)) return;
    }
  }

  throw new ForbiddenError('Forbidden');
}

// ---- payload-derived relation typing ----------------------------------------
// Reads relation keys/arity off Prisma's `$Payload` (the resolved-data type, no
// XOR wrapper). Couples to Prisma's payload shape — the relation-typing tests
// are the tripwire if a Prisma bump reshapes it.

/** The $Payload type for a model prop name (TypeMap keys are PascalCase). */
type PayloadOf<M extends ModelPropName> =
  Prisma.TypeMap['model'][Capitalize<M>] extends { payload: infer P }
    ? P
    : never;

/** The relation `objects` block of a model's payload. */
type ObjectsOf<M extends ModelPropName> =
  PayloadOf<M> extends { objects: infer O } ? O : never;

/** Relation field names of a model (excludes scalars and scalar FKs). */
type RelationKeys<M extends ModelPropName> = keyof ObjectsOf<M> & string;

/**
 * TO-ONE relation keys only. `via` is to-one because its whole value is the
 * parent-keyed cache (N children of one parent → 1 query, keyed on the shared
 * FK). A to-many relation has no single FK to key on, so it would just be a
 * slower `r.where(ctx => ({ rel: { some } }))` — excluded at the type level.
 */
type ToOneRelationKeys<M extends ModelPropName> = {
  [K in RelationKeys<M>]: ObjectsOf<M>[K] extends readonly unknown[]
    ? never
    : K;
}[RelationKeys<M>];

/** `via` link shape — to-one only. */
interface ViaLink<M extends ModelPropName, R extends ToOneRelationKeys<M>> {
  /** FK field on THIS model backing the relation. */
  fk: keyof GetResult<M> & string;
  /** Relation name — must be a TO-ONE relation; typo or to-many → compile error. */
  relation: R;
}

// ============================================================================
// createModelPolicy — one declaration per role; the boolean `check` and the
// Prisma `where` are BOTH derived, with cached delegation (not a per-child
// probe). Role kinds:
//   match   — scalar equality on self (zero-query on a loaded row)
//   where   — arbitrary Prisma filter (DB-evaluated)
//   via     — cached delegation to a parent policy's role
//   hasRole — global/principal-role leaf, nestable
//   authenticated — held if there is any logged-in principal
//   all     — conjunction (AND) of nested nodes
//   some    — disjunction (OR) of nested nodes
//   check   — arbitrary boolean, no where form (instance/mutation checks only)
// ============================================================================

/** The Prisma model delegate (`prisma.blogPost`) — the existence check derives from it. */
type ModelDelegate<M extends ModelPropName> = PrismaClient[M];

/** Existence check derived from the delegate: `count({ AND: [{id}, where] }) > 0`. */
type Exists<TModelName extends ModelPropName> = (
  ctx: ServiceContext,
  id: string,
  where: NonNullable<WhereInput<TModelName>>,
) => Promise<boolean>;

/** Minimal shape of a target policy this model can delegate into. */
interface DelegationTarget {
  roles: Record<
    string,
    {
      checkById: (ctx: ServiceContext, id: string) => Promise<boolean>;
      nestedWhere: (
        ctx: ServiceContext,
        relationField: string,
      ) => WhereResult<ModelPropName>;
    }
  >;
}

// ---- local-match typing (the scalar-equality subset) ------------------------

/**
 * Scalar types whose SQL equality and JS `===` agree. Excludes Date (reference
 * `!==` on same-instant Dates falsely denies) and, by omission, JSON / Decimal /
 * Bytes. The only value type `r.match` accepts.
 */
type LocallyComparable = string | number | bigint | boolean | null;

/**
 * The shape `r.match` accepts: this model's scalar-equality fields → literals.
 * Relation fields aren't `LocallyComparable`, so `{ blog: {...} }` is a compile
 * error — relations use `r.where`. This is what makes `r.match`'s local and
 * Prisma forms provably equivalent rather than a heuristic interpreter.
 */
type LocalMatch<TModelName extends ModelPropName> = Partial<{
  [K in keyof GetResult<TModelName> as GetResult<TModelName>[K] extends LocallyComparable
    ? K
    : never]: GetResult<TModelName>[K] & LocallyComparable;
}>;

// ---- authored role kinds (what `r.*` produces) ------------------------------

/**
 * `r.match` — scalar-equality on this model's own columns. The declared
 * zero-query fast path: `check` evaluates `row[k] === v` in-memory, and the same
 * object is its Prisma `where`. Return `false` to deny unconditionally.
 */
interface MatchRole<TModelName extends ModelPropName> {
  kind: 'match';
  match: (ctx: ServiceContext) => LocalMatch<TModelName> | false;
}
/**
 * `r.where` — an arbitrary Prisma filter; Prisma is the evaluator, so `check`
 * always probes the DB (no in-memory interpretation). For relations/operators.
 */
interface PredicateRole<TModelName extends ModelPropName> {
  kind: 'where';
  where: (ctx: ServiceContext) => WhereResult<TModelName>;
}
/** `r.via` — delegate to a parent policy's role through a FK (cached checkById). */
interface ViaRole<TModelName extends ModelPropName> {
  kind: 'via';
  target: DelegationTarget;
  role: string;
  fk: keyof GetResult<TModelName> & string;
  relation: string;
}
/** `r.hasRole` — a global/principal-role leaf, nestable inside `all`/`some`. */
interface HasRoleLeaf {
  kind: 'hasRole';
  /** Held if the principal has ANY of these roles. */
  roles: readonly string[];
}
/** `r.authenticated` — held if there is any real (logged-in) principal. */
interface AuthenticatedLeaf {
  kind: 'authenticated';
}
/**
 * `r.all` — conjunction; all parts must hold. `check` ANDs them cheapest-first,
 * short-circuiting on the first failure; `where` ANDs the fragments. Parts are
 * `RoleNode`s, so `all`/`some` nest arbitrarily.
 */
interface AllRole<TModelName extends ModelPropName> {
  kind: 'all';
  parts: NonEmptyArray<RoleNode<TModelName>>;
}
/**
 * `r.some` — disjunction; ANY part holds. `check` ORs them cheapest-first,
 * short-circuiting on the first success; `where` ORs the fragments. The `||`
 * sibling of `r.all`. Empty `some` fails SAFE (deny) — opposite of empty `all`.
 */
interface SomeRole<TModelName extends ModelPropName> {
  kind: 'some';
  parts: NonEmptyArray<RoleNode<TModelName>>;
}
/** Tuple with ≥1 element — an empty `all` is allow-all; an empty `some` is deny. */
type NonEmptyArray<T> = [T, ...T[]];
/**
 * `r.check` — an arbitrary boolean over the loaded row, for logic no `where` can
 * express (batch role-set lookups, computed rules). NO where form: usable for
 * mutation/field/instance checks, but a read/filter path throws (guarded).
 */
interface CheckRole<TModelName extends ModelPropName> {
  kind: 'check';
  fn: (ctx: ServiceContext, model: GetResult<TModelName>) => Promise<boolean>;
}
/**
 * The recursive role tree. Leaves (`match`/`via`/`where`/`hasRole`/`check`) and
 * combinators (`all`/`some`) are uniform — an `all`/`some` part is any node, so
 * `(A && B) || C` is `some([all([A, B]), C])`. A top-level role is any node.
 */
type RoleNode<TModelName extends ModelPropName> =
  | MatchRole<TModelName>
  | PredicateRole<TModelName>
  | ViaRole<TModelName>
  | HasRoleLeaf
  | AuthenticatedLeaf
  | AllRole<TModelName>
  | SomeRole<TModelName>
  | CheckRole<TModelName>;
type AuthoredRole<TModelName extends ModelPropName> = RoleNode<TModelName>;

/**
 * The role-builder surface (`r`). Each helper closes over the model type so
 * clauses are typed with no annotations. See the role-kind interfaces above for
 * each kind's semantics.
 */
export interface RoleBuilder<TModelName extends ModelPropName> {
  /** Scalar-equality fast path (zero-query). Return `false` to deny. See `MatchRole`. */
  match: (
    match: (ctx: ServiceContext) => LocalMatch<TModelName> | false,
  ) => MatchRole<TModelName>;
  /** Arbitrary Prisma filter (DB-evaluated). See `PredicateRole`. */
  where: (
    where: (ctx: ServiceContext) => WhereResult<TModelName>,
  ) => PredicateRole<TModelName>;
  /**
   * Delegate to a parent policy's role through a FK (cached checkById). The
   * type checks `relation` is a to-one key and `fk` is a scalar of this model,
   * but NOT that `fk` actually backs `relation` — so the `{ fk, relation }` pair
   * must be a matched pair (the generator derives it from schema; hand-authors
   * must keep them consistent).
   */
  via: <R extends ToOneRelationKeys<TModelName>>(
    target: DelegationTarget,
    role: string,
    link: ViaLink<TModelName, R>,
  ) => ViaRole<TModelName>;
  /** Global/principal-role leaf (held if the principal has any). See `HasRoleLeaf`. */
  hasRole: (...roles: string[]) => HasRoleLeaf;
  /** Authenticated-principal leaf (held if logged in). See `AuthenticatedLeaf`. */
  authenticated: () => AuthenticatedLeaf;
  /** Conjunction (all parts hold), cheapest-first. Parts nest. See `AllRole`. */
  all: (parts: NonEmptyArray<RoleNode<TModelName>>) => AllRole<TModelName>;
  /** Disjunction (any part holds), cheapest-first. Parts nest. See `SomeRole`. */
  some: (parts: NonEmptyArray<RoleNode<TModelName>>) => SomeRole<TModelName>;
  /**
   * Arbitrary boolean over the loaded row; no where form. See `CheckRole`.
   * Multiple `check` roles sharing one memoized resolver (`cachedSet`) collapse
   * to a single query.
   */
  check: (
    fn: (ctx: ServiceContext, model: GetResult<TModelName>) => Promise<boolean>,
  ) => CheckRole<TModelName>;
}

/**
 * A grant: "any of `roles` OR any of `globalRoles` (OR superuser)". Every entry
 * in the `actions` map is one — `read`, CRUD, or a custom verb. A role
 * declaration only; input/data checks are service-layer validation.
 */
export interface ActionGrant<TRoleName extends string> {
  roles?: TRoleName[];
  globalRoles?: string[];
}

/**
 * Members of an action, all derived from the same `{ roles, globalRoles }` grant.
 *
 * Convention: `read` is the fan-out grant — consume its `.where` at read
 * surfaces; don't attach a per-row read `.check` to a field ("filter a list,
 * don't 403 it").
 */
export interface ActionMembers<TModelName extends ModelPropName> {
  /** Instance authz against a loaded row; throws on denial. */
  check: (
    ctx: ServiceContext,
    instance: GetResult<TModelName> | (() => Promise<GetResult<TModelName>>),
  ) => Promise<GetResult<TModelName>>;
  /**
   * The grant as a Prisma filter, AND-composed with an optional caller filter
   * (`{ AND: [callerWhere, authWhere] }`, never a spread). `read`'s primary form;
   * also bulk mutations / editable-rows lists. Unrestricted + no caller filter →
   * `undefined`.
   */
  where: (
    ctx: ServiceContext,
    callerWhere?: WhereInput<TModelName>,
  ) => WhereInput<TModelName> | undefined;
  /**
   * The grant composed into a unique selector for ATOMIC authorized
   * `update`/`delete`: one query, returns the row, no TOCTOU. No match
   * (unauthorized OR absent) → Prisma `P2025` → 404 via `throwIfPrismaNotFound`.
   * Unconditional deny → throws before the query.
   */
  whereUnique: (
    ctx: ServiceContext,
    unique: WhereUniqueInput<TModelName>,
  ) => WhereUniqueInput<TModelName>;
  /**
   * Throws unless the caller holds one of the action's global roles — a row-less
   * principal check for a `create` (or a global-only mutation). Valid ONLY on a
   * grant with no instance roles; throws if the action has any (checking globals
   * alone would skip the per-row check).
   */
  checkGlobalRoles: (ctx: ServiceContext) => void;
}

export interface PolicyRoleMembers<TModelName extends ModelPropName> {
  check: (
    ctx: ServiceContext,
    model: GetResult<TModelName>,
  ) => Promise<boolean>;
  checkById: (ctx: ServiceContext, id: string) => Promise<boolean>;
  /**
   * Throwing form of `checkById` — for the create guarded block, where the
   * request-content grant is "hold this role on the input's parent id". One
   * line: `await policy.roles.owner.assertById(ctx, input.blogId)`.
   */
  assertById: (ctx: ServiceContext, id: string) => Promise<void>;
  nestedWhere: (
    ctx: ServiceContext,
    relationField: string,
  ) => WhereResult<TModelName>;
}

/** The value types `r.match` compares by `===` (see `LocallyComparable`). */
type MatchValue = string | number | bigint | boolean | null;

/**
 * Validate an `r.match` object — every value must be a `MatchValue`. Runs on
 * BOTH paths (check and where) so a bypassed caller can't slip a bad value into
 * either. The load-bearing case is `undefined`: `{ userId: undefined }` reaches
 * Prisma as an OMITTED field → matches every row → allow-all. Throws first.
 */
function validateMatch(match: Record<string, unknown>, role: string): void {
  for (const [key, value] of Object.entries(match)) {
    if (!isMatchValue(value)) {
      const kind = value === undefined ? 'undefined' : typeof value;
      throw new Error(
        `r.match role '${role}' produced a non-scalar value for '${key}' ` +
          `(${kind}). \`r.match\` is scalar-equality only and forbids ` +
          `\`undefined\` (which Prisma would omit → match-all). Return \`false\` ` +
          `to deny, or use \`r.where\` for relations/operators.`,
      );
    }
  }
}

/** Evaluate a validated `r.match` against a loaded row: `row[k] === v` for all k. */
function evaluateMatch(
  match: Record<string, unknown>,
  row: Record<string, unknown>,
  role: string,
): boolean {
  validateMatch(match, role);
  for (const [key, expected] of Object.entries(match)) {
    if (row[key] !== expected) return false;
  }
  return true;
}

function isMatchValue(v: unknown): v is MatchValue {
  return (
    v === null ||
    typeof v === 'string' ||
    typeof v === 'number' ||
    typeof v === 'bigint' ||
    typeof v === 'boolean'
  );
}

/**
 * Reject `undefined` from a role's `r.where` result — the type forbids it
 * (`WhereResult` is `NonNullable`), but a bypassed caller must fail loud:
 * `undefined` reads as UNRESTRICTED downstream, so a deny would become allow-all.
 * Deny is `false`, never `undefined`.
 */
function assertNotUndefined<T>(value: T | undefined, role: string): T {
  if (value === undefined) {
    throw new Error(
      `r.where role '${role}' returned \`undefined\`, which would read as ` +
        `UNRESTRICTED (allow-all). Return \`false\` to deny, or a where object.`,
    );
  }
  return value;
}

/**
 * Memoize a per-request async set (e.g. "the user's roles on this team"),
 * coalescing concurrent callers onto one query and evicting on rejection. Lets N
 * `r.check` roles sharing one resolver key collapse to a single query, then a
 * cheap `.has(role)`. Stored in `authorizerModelCache`.
 */
export async function cachedSet<T>(
  ctx: ServiceContext,
  key: string,
  compute: () => Promise<Set<T>>,
): Promise<Set<T>> {
  const cacheKey = `roleset:${key}`;
  const existing = ctx.authorizerModelCache.get(cacheKey) as
    | Promise<Set<T>>
    | undefined;
  if (existing !== undefined) return existing;

  const promise = compute().catch((err: unknown) => {
    ctx.authorizerModelCache.delete(cacheKey); // evict on rejection
    throw err;
  });
  ctx.authorizerModelCache.set(cacheKey, promise);
  return promise;
}

/** Does the principal hold any of these global/superuser roles? */
function hasGlobalRole(
  ctx: ServiceContext,
  globalRoles: readonly string[],
): boolean {
  return globalRoles.length > 0 && ctx.auth.hasSomeRole(globalRoles as never);
}

/**
 * Cache a boolean role result per request, coalescing concurrent callers: a
 * settled result is returned directly; an in-flight promise for the same key is
 * shared (so N siblings on one parent key collapse to ONE query); a rejection
 * evicts (never caches a failure). Relies on the caches being PER-REQUEST with
 * one principal — the key omits principal identity.
 */
function cachedBoolean(
  ctx: ServiceContext,
  key: string,
  compute: () => Promise<boolean>,
): Promise<boolean> {
  const settled = ctx.authorizerCache.get(key);
  if (settled !== undefined) return Promise.resolve(settled);

  const inflightKey = `inflight:${key}`;
  const existing = ctx.authorizerModelCache.get(inflightKey) as
    | Promise<boolean>
    | undefined;
  if (existing !== undefined) return existing;

  const promise = compute().then(
    (result) => {
      ctx.authorizerCache.set(key, result);
      ctx.authorizerModelCache.delete(inflightKey);
      return result;
    },
    (err: unknown) => {
      // Evict on rejection — never cache a failure.
      ctx.authorizerModelCache.delete(inflightKey);
      throw err;
    },
  );
  ctx.authorizerModelCache.set(inflightKey, promise);
  return promise;
}

export function createModelPolicy<
  TModelName extends ModelPropName,
  const TRoles extends Record<string, AuthoredRole<TModelName>>,
  const TActions extends {
    // `read` is REQUIRED — a model with no read grant leaks by default, so "who
    // can read this?" must be a decision, not an omission. Close an action with
    // an EMPTY grant (`{ roles: [] }`): implicit deny, but superuser still folds
    // in (no absolute-deny; narrow `superuser` to lock admins out).
    read: ActionGrant<Extract<keyof TRoles, string>>;
  } & Record<string, ActionGrant<Extract<keyof TRoles, string>>>,
>(config: {
  model: TModelName;
  idField: keyof GetResult<TModelName> & string;
  /** The Prisma model delegate — `prisma.blogPost`. The count/existence check is derived from it. */
  delegate: ModelDelegate<TModelName>;
  superuser?: string[];
  roles: (r: RoleBuilder<TModelName>) => TRoles;
  /**
   * The whole authorization surface, as ONE map of grants — `read` (required),
   * CRUD, and custom verbs (`retitle`, `archive`) alike, since a grant is a role
   * declaration either way. Each derives `.where` and `.check` from the same
   * `{ roles?, globalRoles? }`.
   */
  actions: TActions;
}): {
  readonly model: TModelName;
  readonly roles: {
    readonly [K in keyof TRoles]: PolicyRoleMembers<TModelName>;
  };
} & { readonly [K in keyof TActions]: ActionMembers<TModelName> } {
  const superuser = config.superuser ?? [];

  const builder: RoleBuilder<TModelName> = {
    match: (match) => ({ kind: 'match', match }),
    where: (where) => ({ kind: 'where', where }),
    via: (target, role, link) => ({
      kind: 'via',
      target,
      role,
      fk: link.fk,
      relation: link.relation,
    }),
    all: (parts) => {
      // Runtime backstop for a bypassed caller: an empty conjunction is vacuous
      // truth (allow-all). The tuple type makes this a compile error already;
      // this throws if someone reaches `all` with a widened `[]` at runtime.
      if (parts.length === 0) {
        throw new Error(
          'r.all requires at least one part (empty → allow-all).',
        );
      }
      return { kind: 'all', parts };
    },
    some: (parts) => {
      // Empty `some` fails SAFE (deny) — but still reject it so a widened `[]`
      // isn't a silent no-op grant.
      if (parts.length === 0) {
        throw new Error('r.some requires at least one part.');
      }
      return { kind: 'some', parts };
    },
    hasRole: (...roles) => ({ kind: 'hasRole', roles }),
    authenticated: () => ({ kind: 'authenticated' }),
    check: (fn) => ({ kind: 'check', fn }),
  };
  const authored = config.roles(builder);

  // Existence check derived from the delegate. The cast narrows Prisma's `count`
  // overload to the single no-`select` form we use — the one boundary cast, in
  // shared infra, so no policy author writes it.
  const countFn = (
    config.delegate as unknown as {
      count: (args: {
        where: NonNullable<WhereInput<TModelName>>;
      }) => Promise<number>;
    }
  ).count;
  const exists: Exists<TModelName> = (_ctx, id, where) =>
    countFn({
      where: {
        AND: [{ [config.idField]: id }, where],
      } as NonNullable<WhereInput<TModelName>>,
    }).then((n) => n > 0);

  function roleCacheKey(id: string | number, role: string): string {
    return `authz:${config.model}:role:${role}:${String(id)}`;
  }

  // ---- recursive tree walk (leaves + all/some combinators) ----------------
  // `key` is the hierarchical cache key path (`role#0#1`) so nested parts don't
  // collide in the role cache. `whereNode`/`checkNode` are the two forms; the
  // `all`/`some` cases recurse.

  /** Order parts cheapest-first: local leaves (match/hasRole) before probes. */
  function cheapestFirst(
    parts: readonly RoleNode<TModelName>[],
  ): { node: RoleNode<TModelName>; i: number }[] {
    const cheap = (n: RoleNode<TModelName>): number =>
      n.kind === 'match' || n.kind === 'hasRole' || n.kind === 'authenticated'
        ? 0
        : 1;
    return parts
      .map((node, i) => ({ node, i }))
      .toSorted((a, b) => cheap(a.node) - cheap(b.node));
  }

  /** The where fragment for a role node. Throws for `check` (no where form). */
  function whereNode(
    ctx: ServiceContext,
    node: RoleNode<TModelName>,
    key: string,
  ): WhereResult<TModelName> {
    switch (node.kind) {
      case 'match': {
        // A match's Prisma filter IS its object. Validate on the where path too
        // — an unvalidated `{ userId: undefined }` would reach Prisma as an
        // omitted field → match-all.
        const m = node.match(ctx);
        if (m === false) return false;
        validateMatch(m as Record<string, unknown>, key);
        return m as WhereResult<TModelName>;
      }
      case 'via': {
        return node.target.roles[node.role].nestedWhere(
          ctx,
          node.relation,
        ) as WhereResult<TModelName>;
      }
      case 'where': {
        return assertNotUndefined(node.where(ctx), key);
      }
      case 'hasRole': {
        // Held → unrestricted (`true` folds through queryHelpers); else `false`
        // (drops out of an OR, denies an AND).
        return hasGlobalRole(ctx, node.roles);
      }
      case 'authenticated': {
        // Logged in → unrestricted; anonymous → deny. Same boolean fold.
        return ctx.auth.isAuthenticated;
      }
      case 'all': {
        return queryHelpers.and(
          node.parts.map((p, i) => whereNode(ctx, p, `${key}#${i}`)),
        );
      }
      case 'some': {
        return queryHelpers.or(
          node.parts.map((p, i) => whereNode(ctx, p, `${key}#${i}`)),
        );
      }
      case 'check': {
        // No where form — must throw INSIDE the recursion, so a `check` buried
        // in `some([..., check])` on a where path fails too, not just at root.
        throw new Error(
          `Role node '${key}' on '${config.model}' is check-only (no where ` +
            `form) — it can't back an action's \`.where\` (read/list/bulk/` +
            `editable), a \`nestedWhere\` delegation, or \`checkById\`/` +
            `\`assertById\`. Use \`r.where\` for those paths.`,
        );
      }
    }
  }

  /** Boolean check for a role node against a loaded row. */
  async function checkNode(
    ctx: ServiceContext,
    node: RoleNode<TModelName>,
    key: string,
    model: GetResult<TModelName>,
  ): Promise<boolean> {
    switch (node.kind) {
      case 'match': {
        // Zero-query fast path: scalar equality in-memory, no probe.
        const m = node.match(ctx);
        if (m === false) return false;
        return evaluateMatch(
          m as Record<string, unknown>,
          model as Record<string, unknown>,
          key,
        );
      }
      case 'via': {
        // Delegation: parent's cached checkById, keyed on the PARENT id → N
        // children of one parent collapse to 1 query, even concurrently.
        const fkVal = String(model[node.fk]);
        return node.target.roles[node.role].checkById(ctx, fkVal);
      }
      case 'where': {
        const where = assertNotUndefined(node.where(ctx), key);
        if (where === true) return true;
        if (where === false) return false;
        const id = String(model[config.idField]);
        return cachedBoolean(ctx, roleCacheKey(id, key), () =>
          exists(ctx, id, where),
        );
      }
      case 'hasRole': {
        return hasGlobalRole(ctx, node.roles);
      }
      case 'authenticated': {
        return ctx.auth.isAuthenticated;
      }
      case 'all': {
        // Cheapest-first short-circuit: a failing local part returns false
        // before any cached-via/where probe.
        for (const { node: part, i } of cheapestFirst(node.parts)) {
          if (!(await checkNode(ctx, part, `${key}#${i}`, model))) return false;
        }
        return true;
      }
      case 'some': {
        // Cheapest-first short-circuit: a passing local part grants before any
        // probe.
        for (const { node: part, i } of cheapestFirst(node.parts)) {
          if (await checkNode(ctx, part, `${key}#${i}`, model)) return true;
        }
        return false;
      }
      case 'check': {
        // Arbitrary boolean; the fn owns its own batching/caching (see cachedSet).
        return node.fn(ctx, model);
      }
    }
  }

  const roleWhere = (
    ctx: ServiceContext,
    role: string,
  ): WhereResult<TModelName> => whereNode(ctx, authored[role], role);

  const checkRole = (
    ctx: ServiceContext,
    role: string,
    model: GetResult<TModelName>,
  ): Promise<boolean> => checkNode(ctx, authored[role], role, model);

  function checkRoleById(
    ctx: ServiceContext,
    role: string,
    id: string,
  ): Promise<boolean> {
    // Resolve to a single where (an `all` folds to a conjoined where via
    // roleWhere) and probe by id, coalesced on the shared key.
    const where = roleWhere(ctx, role);
    if (where === true) return Promise.resolve(true);
    if (where === false) return Promise.resolve(false);
    return cachedBoolean(ctx, roleCacheKey(id, role), () =>
      exists(ctx, id, where),
    );
  }

  const roleMembers = {} as {
    [K in keyof TRoles]: PolicyRoleMembers<TModelName>;
  };
  for (const roleName of Object.keys(authored) as (keyof TRoles & string)[]) {
    roleMembers[roleName] = {
      check: (ctx, model) => checkRole(ctx, roleName, model),
      checkById: (ctx, id) => checkRoleById(ctx, roleName, id),
      assertById: async (ctx, id) => {
        if (!(await checkRoleById(ctx, roleName, id))) {
          throw new ForbiddenError(
            `Forbidden: requires role '${roleName}' on '${config.model}' ${id}.`,
          );
        }
      },
      nestedWhere: (ctx, relationField) => {
        const w = roleWhere(ctx, roleName);
        if (w === true) return true;
        if (w === false) return false;
        // via is to-one only → direct nesting `{ relation: w }`, no `{ some }`.
        return { [relationField]: w } as WhereResult<TModelName>;
      },
    };
  }

  // ---- shared enforcement primitives (every action's members derive from these) --

  /**
   * The ONE instance-enforcement path — every action's `.check` routes through
   * it, so superuser fold-in can't be forgotten. Enforces "any `roleNames` OR
   * any `globalRoles`", loading the row lazily; returns the loaded row (so a
   * loader isn't invoked twice); throws `ForbiddenError` on failure.
   */
  async function checkRolesOrThrow(
    ctx: ServiceContext,
    roleNames: readonly (keyof TRoles & string)[],
    globalRoles: readonly string[],
    instance: GetResult<TModelName> | (() => Promise<GetResult<TModelName>>),
  ): Promise<GetResult<TModelName>> {
    if (hasGlobalRole(ctx, globalRoles)) {
      // Global grant matched — but still resolve the loader: the return contract
      // is "the loaded row". Don't return early without it.
      return typeof instance === 'function' ? instance() : instance;
    }
    const model = typeof instance === 'function' ? await instance() : instance;
    for (const r of roleNames) {
      if (await checkRole(ctx, r, model)) return model;
    }
    const triedGlobals =
      globalRoles.length > 0 ? ` or globals [${globalRoles.join(', ')}]` : '';
    throw new ForbiddenError(
      `Forbidden on '${config.model}': none of [${roleNames.join(', ')}]` +
        `${triedGlobals} granted access.`,
    );
  }

  /**
   * WHERE form of "any of `roleNames` OR `globalRoles`", AND-composed with an
   * optional caller filter. `undefined` = unrestricted (no auth filter AND no
   * caller filter); throws if every role denied unconditionally. Backs every
   * action's `.where` — the same OR-of-roles its `.check` enforces. The auth
   * filter and caller filter are joined with `AND` (never a spread), so a caller
   * cannot overwrite the auth filter.
   */
  function rolesToWhere(
    ctx: ServiceContext,
    roleNames: readonly string[],
    globalRoles: readonly string[],
    callerWhere?: WhereInput<TModelName>,
  ): WhereInput<TModelName> | undefined {
    // Auth filter: `undefined` = the grant imposes no restriction (a global role
    // matched, or a role is unconditionally true). Distinct from the caller's.
    const authWhere = ((): WhereInput<TModelName> | undefined => {
      if (hasGlobalRole(ctx, globalRoles)) return undefined;
      const combined = queryHelpers.or(roleNames.map((r) => roleWhere(ctx, r)));
      if (combined === true) return undefined;
      if (combined === false) throw new ForbiddenError('Forbidden');
      return combined;
    })();

    // Compose. Only one side present → return it as-is; both → AND-nest.
    if (authWhere === undefined) return callerWhere;
    if (callerWhere === undefined) return authWhere;
    return { AND: [callerWhere, authWhere] } as WhereInput<TModelName>;
  }

  /** Build an action's members from its grant (superuser folded into globals). */
  function buildAction(
    grant: ActionGrant<Extract<keyof TRoles, string>>,
  ): ActionMembers<TModelName> {
    const roleNames = grant.roles ?? [];
    const globalRoles = [...(grant.globalRoles ?? []), ...superuser];
    return {
      check: (ctx, instance) =>
        checkRolesOrThrow(ctx, roleNames, globalRoles, instance),
      where: (ctx, callerWhere) =>
        rolesToWhere(ctx, roleNames, globalRoles, callerWhere),
      whereUnique: (ctx, unique) => {
        // Auth filter alone (no caller filter — the unique selector rides
        // separately). `undefined` = unrestricted → return the selector as-is;
        // total-deny throws inside rolesToWhere before we compose.
        const authWhere = rolesToWhere(ctx, roleNames, globalRoles);
        if (authWhere === undefined) return unique;
        // APPEND to the caller's existing `AND`, never replace it — a caller may
        // pass `{ id, AND: [{ status: 'DRAFT' }] }` as a business invariant, and
        // clobbering it would drop that guard. Prisma's `AND` is `X | X[]`, so
        // normalize to an array before appending the auth filter.
        const { AND: existingAnd, ...rest } = unique as {
          AND?: WhereInput<TModelName> | WhereInput<TModelName>[];
        } & Record<string, unknown>;
        const priorAnd = Array.isArray(existingAnd)
          ? existingAnd
          : existingAnd !== undefined
            ? [existingAnd]
            : [];
        return {
          ...rest,
          AND: [...priorAnd, authWhere],
        } as WhereUniqueInput<TModelName>;
      },
      checkGlobalRoles: (ctx) => {
        // A principal-only check is sound ONLY when the grant has no instance
        // roles. If it did, checking globals alone would silently skip the
        // per-row check the instance role exists to enforce — fail loud instead.
        if (roleNames.length > 0) {
          throw new Error(
            `checkGlobalRoles is not valid on an action with instance roles [${roleNames.join(', ')}] — use whereUnique (atomic) or check (per-row) instead.`,
          );
        }
        if (!hasGlobalRole(ctx, globalRoles)) {
          throw new ForbiddenError(
            `Forbidden: requires one of [${globalRoles.join(', ')}].`,
          );
        }
      },
    };
  }

  const actionMembers = {} as {
    [K in keyof TActions]: ActionMembers<TModelName>;
  };
  for (const a of Object.keys(config.actions) as (keyof TActions & string)[]) {
    actionMembers[a] = buildAction(config.actions[a]);
  }

  return {
    model: config.model,
    roles: roleMembers,
    ...actionMembers,
  } as {
    readonly model: TModelName;
    readonly roles: {
      readonly [K in keyof TRoles]: PolicyRoleMembers<TModelName>;
    };
  } & { readonly [K in keyof TActions]: ActionMembers<TModelName> };
}
