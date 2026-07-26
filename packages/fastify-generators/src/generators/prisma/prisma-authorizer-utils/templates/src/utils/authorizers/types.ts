// @ts-nocheck

import type { AuthUserSessionInfo } from '%authContextImports';
import type {
  GetResult,
  ModelPropName,
  WhereInput,
  WhereUniqueInput,
} from '%dataUtilsImports';
import type { Prisma, PrismaClient } from '%prismaGeneratedImports';
import type { WhereResult } from '%prismaQueryFilterUtilsImports';
import type { ServiceContext } from '%serviceContextImports';

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
export type ToOneRelationKeys<M extends ModelPropName> = {
  [K in RelationKeys<M>]: ObjectsOf<M>[K] extends readonly unknown[]
    ? never
    : K;
}[RelationKeys<M>];

/**
 * `via` link shape — to-one only. `keys` maps THIS model's FK field(s) to the
 * TARGET's id field(s) they reference (local → target) — e.g. `{ blogId: 'id' }`
 * for `BlogPost.blogId → Blog.id`, or `{ blogId: 'blogId', userId: 'userId' }`
 * for a composite FK. `keys`' VALUES are typed against `TTargetIdField` (the
 * target policy's actual id fields, inferred at the `r.via(...)` call site),
 * so a typo'd target field name is a compile error. `createModelPolicy` also
 * validates full/non-duplicate coverage of the target's id fields at
 * construction time — see `RoleBuilder.via`'s docs for what is and isn't checked.
 */
export interface ViaLink<
  M extends ModelPropName,
  R extends ToOneRelationKeys<M>,
  TTargetIdField extends string,
> {
  relation: R;
  // `NoInfer` pins `TTargetIdField` to the `target` argument's own id-field
  // union ONLY — without it, TS treats `keys`' literal values as a SECOND
  // inference candidate and just widens `TTargetIdField` to include them
  // (e.g. `'id' | 'typoedField'`), silently accepting the typo instead of
  // rejecting it against the target's real fields.
  keys: Partial<Record<keyof GetResult<M> & string, NoInfer<TTargetIdField>>>;
}

// ============================================================================
// createModelPolicy — one declaration per role; the boolean `check` and the
// Prisma `where` are BOTH derived, with cached delegation (not a per-child
// probe). Role kinds:
//   match     — scalar equality on self (zero-query on a loaded row)
//   userMatch — like `match`, but only for an authenticated principal (auto-denies anonymous)
//   where     — arbitrary Prisma filter (DB-evaluated)
//   userWhere — like `where`, but only for an authenticated principal (auto-denies anonymous)
//   via     — cached delegation to a parent policy's role
//   hasRole — global/principal-role leaf, nestable
//   authenticated — held if there is any logged-in principal
//   all     — conjunction (AND) of nested nodes
//   some    — disjunction (OR) of nested nodes
//   check   — arbitrary boolean, no where form (instance/mutation checks only)
// ============================================================================

/** The Prisma model delegate (`prisma.blogPost`) — the existence check derives from it. */
export type ModelDelegate<M extends ModelPropName> = PrismaClient[M];

/** Existence check derived from the delegate: `count({ AND: [ids, where] }) > 0`. */
export type Exists<TModelName extends ModelPropName> = (
  ctx: ServiceContext,
  ids: Record<string, string | number>,
  where: NonNullable<WhereInput<TModelName>>,
) => Promise<boolean>;

/**
 * Minimal shape of a target policy this model can delegate into. Generic over
 * the target's own id field name(s) — lets a `via` call's `keys` VALUES be
 * type-checked against the real target at the `r.via(...)` call site, turning
 * a typo'd target field name into a compile error instead of a construction-
 * time throw.
 */
export interface DelegationTarget<TIdField extends string = string> {
  /** The target's own declared id field(s) — validates a `via` link's `keys` values. */
  idFields: readonly TIdField[];
  roles: Record<
    string,
    {
      checkById: (
        ctx: ServiceContext,
        ids: Record<TIdField, string | number>,
      ) => Promise<boolean>;
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
export type LocallyComparable = string | number | bigint | boolean | null;

/**
 * The shape `r.match` accepts: this model's scalar-equality fields → literals.
 * Relation fields aren't `LocallyComparable`, so `{ blog: {...} }` is a compile
 * error — relations use `r.where`. This is what makes `r.match`'s local and
 * Prisma forms provably equivalent rather than a heuristic interpreter.
 */
export type LocalMatch<TModelName extends ModelPropName> = Partial<{
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
export interface MatchRole<TModelName extends ModelPropName> {
  kind: 'match';
  match: (ctx: ServiceContext) => LocalMatch<TModelName> | false;
}
/**
 * `r.where` — an arbitrary Prisma filter; Prisma is the evaluator, so `check`
 * always probes the DB (no in-memory interpretation). For relations/operators.
 */
export interface PredicateRole<TModelName extends ModelPropName> {
  kind: 'where';
  where: (ctx: ServiceContext) => WhereResult<TModelName>;
}
/**
 * `r.userMatch` — like `r.match`, but the callback only runs for an
 * authenticated principal (a `type: 'user'` session), receiving that session
 * (`userId` guaranteed non-null) alongside `ctx`. Unauthenticated → deny,
 * callback never invoked. Removes the per-callsite
 * `ctx.auth.userId != null ? {...} : false` guard.
 */
export interface UserMatchRole<TModelName extends ModelPropName> {
  kind: 'userMatch';
  userMatch: (
    session: AuthUserSessionInfo,
    ctx: ServiceContext,
  ) => LocalMatch<TModelName> | false;
}
/**
 * `r.userWhere` — like `r.where`, but the callback only runs for an
 * authenticated principal (a `type: 'user'` session), receiving that session
 * (`userId` guaranteed non-null) alongside `ctx`.
 */
export interface UserWhereRole<TModelName extends ModelPropName> {
  kind: 'userWhere';
  userWhere: (
    session: AuthUserSessionInfo,
    ctx: ServiceContext,
  ) => WhereResult<TModelName>;
}
/** `r.via` — delegate to a parent policy's role through a FK (cached checkById). */
export interface ViaRole<TModelName extends ModelPropName> {
  kind: 'via';
  target: DelegationTarget;
  role: string;
  /** Local FK field(s) → target id field(s) — see `ViaLink`. */
  keys: Partial<Record<keyof GetResult<TModelName> & string, string>>;
  relation: string;
}
/** `r.hasRole` — a global/principal-role leaf, nestable inside `all`/`some`. */
export interface HasRoleLeaf {
  kind: 'hasRole';
  /** Held if the principal has ANY of these roles. */
  roles: readonly string[];
}
/** `r.authenticated` — held if there is any real (logged-in) principal. */
export interface AuthenticatedLeaf {
  kind: 'authenticated';
}
/**
 * `r.all` — conjunction; all parts must hold. `check` ANDs them cheapest-first,
 * short-circuiting on the first failure; `where` ANDs the fragments. Parts are
 * `RoleNode`s, so `all`/`some` nest arbitrarily.
 */
export interface AllRole<TModelName extends ModelPropName> {
  kind: 'all';
  parts: NonEmptyArray<RoleNode<TModelName>>;
}
/**
 * `r.some` — disjunction; ANY part holds. `check` ORs them cheapest-first,
 * short-circuiting on the first success; `where` ORs the fragments. The `||`
 * sibling of `r.all`. Empty `some` fails SAFE (deny) — opposite of empty `all`.
 */
export interface SomeRole<TModelName extends ModelPropName> {
  kind: 'some';
  parts: NonEmptyArray<RoleNode<TModelName>>;
}
/** Tuple with ≥1 element — an empty `all` is allow-all; an empty `some` is deny. */
export type NonEmptyArray<T> = [T, ...T[]];
/**
 * `r.check` — an arbitrary boolean over the loaded row, for logic no `where` can
 * express (batch role-set lookups, computed rules). NO where form: usable for
 * mutation/field/instance checks, but a read/filter path throws (guarded).
 */
export interface CheckRole<TModelName extends ModelPropName> {
  kind: 'check';
  fn: (ctx: ServiceContext, model: GetResult<TModelName>) => Promise<boolean>;
}
/**
 * The recursive role tree. Leaves (`match`/`via`/`where`/`hasRole`/`check`) and
 * combinators (`all`/`some`) are uniform — an `all`/`some` part is any node, so
 * `(A && B) || C` is `some([all([A, B]), C])`. A top-level role is any node.
 */
export type RoleNode<TModelName extends ModelPropName> =
  | MatchRole<TModelName>
  | UserMatchRole<TModelName>
  | PredicateRole<TModelName>
  | UserWhereRole<TModelName>
  | ViaRole<TModelName>
  | HasRoleLeaf
  | AuthenticatedLeaf
  | AllRole<TModelName>
  | SomeRole<TModelName>
  | CheckRole<TModelName>;
export type AuthoredRole<TModelName extends ModelPropName> =
  RoleNode<TModelName>;

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
   * Authenticated scalar-equality fast path (zero-query). Callback only runs
   * for a `type: 'user'` session — unauthenticated denies without calling it.
   * See `UserMatchRole`.
   */
  userMatch: (
    userMatch: (
      session: AuthUserSessionInfo,
      ctx: ServiceContext,
    ) => LocalMatch<TModelName> | false,
  ) => UserMatchRole<TModelName>;
  /**
   * Authenticated Prisma filter (DB-evaluated). Callback only runs for a
   * `type: 'user'` session — unauthenticated denies without calling it. See
   * `UserWhereRole`.
   */
  userWhere: (
    userWhere: (
      session: AuthUserSessionInfo,
      ctx: ServiceContext,
    ) => WhereResult<TModelName>,
  ) => UserWhereRole<TModelName>;
  /**
   * Delegate to a parent policy's role through a FK (cached checkById).
   *
   * WHAT IS validated (compile-time AND construction-time): `relation` is a
   * to-one key of this model; `keys`' keys are scalar fields of this model;
   * `keys`' VALUES are exactly the target's declared id field(s) — no
   * mismatched, duplicate, or missing target coverage (see
   * `createModelPolicy`'s construction-time throw).
   *
   * WHAT IS NOT validated: that `keys` actually backs the named `relation`.
   * `{ relation: 'blog', keys: { publisherId: 'id' } }` passes every check
   * above (`publisherId` is a scalar, `'id'` is a real target id field) but
   * silently authorizes `.check` through `publisherId` while `.where`/
   * `nestedWhere` authorize through the ACTUAL `blog` relation — two
   * different fields. Generated policies are safe: the compiler derives
   * `keys` from the schema's real FK reference for `relation`, so the pair
   * can't drift. Hand-authored `via` calls must keep `relation` and `keys`
   * consistent by hand — there is no metadata here to check them against.
   */
  via: <R extends ToOneRelationKeys<TModelName>, TTargetIdField extends string>(
    target: DelegationTarget<TTargetIdField>,
    role: string,
    link: ViaLink<TModelName, R, TTargetIdField>,
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

export interface PolicyRoleMembers<
  TModelName extends ModelPropName,
  TIdField extends string = string,
> {
  check: (
    ctx: ServiceContext,
    model: GetResult<TModelName>,
  ) => Promise<boolean>;
  checkById: (
    ctx: ServiceContext,
    ids: Record<TIdField, string | number>,
  ) => Promise<boolean>;
  /**
   * Throwing form of `checkById` — for the create guarded block, where the
   * request-content grant is "hold this role on the input's parent id(s)". One
   * line: `await policy.roles.owner.assertById(ctx, { id: input.blogId })`.
   */
  assertById: (
    ctx: ServiceContext,
    ids: Record<TIdField, string | number>,
  ) => Promise<void>;
  nestedWhere: (
    ctx: ServiceContext,
    relationField: string,
  ) => WhereResult<TModelName>;
}
