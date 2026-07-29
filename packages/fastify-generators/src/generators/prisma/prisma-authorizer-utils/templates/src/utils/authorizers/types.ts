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

type PayloadOf<M extends ModelPropName> =
  Prisma.TypeMap['model'][Capitalize<M>] extends { payload: infer P }
    ? P
    : never;

type ObjectsOf<M extends ModelPropName> =
  PayloadOf<M> extends { objects: infer O } ? O : never;

type RelationKeys<M extends ModelPropName> = keyof ObjectsOf<M> & string;

export type ToOneRelationKeys<M extends ModelPropName> = {
  [K in RelationKeys<M>]: ObjectsOf<M>[K] extends readonly unknown[]
    ? never
    : K;
}[RelationKeys<M>];

export type ToManyRelationKeys<M extends ModelPropName> = {
  [K in RelationKeys<M>]: ObjectsOf<M>[K] extends readonly unknown[]
    ? K
    : never;
}[RelationKeys<M>];

/**
 * The model a relation points at, as a `ModelPropName`. Every Prisma payload
 * carries its own PascalCase `name` (`$BlogUserPayload` → `"BlogUser"`), so the
 * relation's target model is recoverable from the type alone — uncapitalized
 * back to the camelCase prop name policies are keyed by.
 */
type RelationModel<M extends ModelPropName, K extends RelationKeys<M>> = (
  ObjectsOf<M>[K] extends readonly (infer E)[] ? E : ObjectsOf<M>[K]
) extends { name: infer N extends string }
  ? Uncapitalize<N> & ModelPropName
  : never;

/**
 * To-many relations of `M` that point at model `TTarget` — the relations a
 * `viaMany` delegating to a `TTarget` policy may legally name. Without this, any
 * to-many relation type-checks and a mismatched pairing (`members` vs `posts`)
 * silently filters the wrong model.
 */
export type ToManyRelationKeysOf<
  M extends ModelPropName,
  TTarget extends ModelPropName,
> = {
  [K in ToManyRelationKeys<M>]: RelationModel<M, K> extends TTarget ? K : never;
}[ToManyRelationKeys<M>];

export interface ViaLink<
  M extends ModelPropName,
  R extends ToOneRelationKeys<M>,
  TTargetIdField extends string,
> {
  relation: R;
  keys: Partial<Record<keyof GetResult<M> & string, NoInfer<TTargetIdField>>>;
}

export type ModelDelegate<M extends ModelPropName> = PrismaClient[M];

export type Exists<TModelName extends ModelPropName> = (
  ctx: ServiceContext,
  ids: Record<string, string | number>,
  where: NonNullable<WhereInput<TModelName>>,
) => Promise<boolean>;

export interface DelegationTarget<
  TIdField extends string = string,
  TRoleName extends string = string,
  TModel extends ModelPropName = ModelPropName,
> {
  /** The model this policy governs — lets `viaMany` verify the relation matches. */
  readonly model: TModel;
  idFields: readonly TIdField[];
  roles: Record<
    TRoleName,
    {
      checkById: (
        ctx: ServiceContext,
        ids: Record<TIdField, string | number>,
      ) => Promise<boolean>;
      nestedWhere: (
        ctx: ServiceContext,
        relationField: string,
      ) => WhereResult<ModelPropName>;
      nestedWhereMany: (
        ctx: ServiceContext,
        relationField: string,
      ) => WhereResult<ModelPropName>;
    }
  >;
}

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

export interface MatchRole<TModelName extends ModelPropName> {
  kind: 'match';
  match: (ctx: ServiceContext) => LocalMatch<TModelName> | false;
}

export interface PredicateRole<TModelName extends ModelPropName> {
  kind: 'where';
  where: (ctx: ServiceContext) => WhereResult<TModelName>;
}

export interface UserMatchRole<TModelName extends ModelPropName> {
  kind: 'userMatch';
  userMatch: (
    session: AuthUserSessionInfo,
    ctx: ServiceContext,
  ) => LocalMatch<TModelName> | false;
}

export interface UserWhereRole<TModelName extends ModelPropName> {
  kind: 'userWhere';
  userWhere: (
    session: AuthUserSessionInfo,
    ctx: ServiceContext,
  ) => WhereResult<TModelName>;
}

export interface ViaRole<TModelName extends ModelPropName> {
  kind: 'via';
  target: DelegationTarget;
  role: string;
  keys: Partial<Record<keyof GetResult<TModelName> & string, string>>;
  relation: string;
}

/**
 * Existential delegation across a to-many relation: "I hold this role iff SOME
 * related row grants `role`". The to-many counterpart of {@link ViaRole}.
 *
 * Unlike `via` there is no local FK to read off the row, so both the `where`
 * and `check` forms go through `{ relation: { some: <target role where> } }` —
 * `check` probes the host by its own id(s) with that same filter, so the two
 * forms are one query and cannot drift.
 */
export interface ViaManyRole<TModelName extends ModelPropName> {
  kind: 'viaMany';
  target: DelegationTarget;
  role: string;
  relation: ToManyRelationKeys<TModelName>;
}

export interface HasRoleLeaf {
  kind: 'hasRole';
  roles: readonly string[];
}

export interface AuthenticatedLeaf {
  kind: 'authenticated';
}

export interface AllRole<TModelName extends ModelPropName> {
  kind: 'all';
  parts: NonEmptyArray<RoleNode<TModelName>>;
}

export interface SomeRole<TModelName extends ModelPropName> {
  kind: 'some';
  parts: NonEmptyArray<RoleNode<TModelName>>;
}

export type NonEmptyArray<T> = [T, ...T[]];

export interface CheckRole<TModelName extends ModelPropName> {
  kind: 'check';
  fn: (ctx: ServiceContext, model: GetResult<TModelName>) => Promise<boolean>;
}

export type RoleNode<TModelName extends ModelPropName> =
  | MatchRole<TModelName>
  | UserMatchRole<TModelName>
  | PredicateRole<TModelName>
  | UserWhereRole<TModelName>
  | ViaRole<TModelName>
  | ViaManyRole<TModelName>
  | HasRoleLeaf
  | AuthenticatedLeaf
  | AllRole<TModelName>
  | SomeRole<TModelName>
  | CheckRole<TModelName>;
export type AuthoredRole<TModelName extends ModelPropName> =
  RoleNode<TModelName>;

export interface RoleBuilder<TModelName extends ModelPropName> {
  match: (
    match: (ctx: ServiceContext) => LocalMatch<TModelName> | false,
  ) => MatchRole<TModelName>;
  where: (
    where: (ctx: ServiceContext) => WhereResult<TModelName>,
  ) => PredicateRole<TModelName>;
  userMatch: (
    userMatch: (
      session: AuthUserSessionInfo,
      ctx: ServiceContext,
    ) => LocalMatch<TModelName> | false,
  ) => UserMatchRole<TModelName>;
  userWhere: (
    userWhere: (
      session: AuthUserSessionInfo,
      ctx: ServiceContext,
    ) => WhereResult<TModelName>,
  ) => UserWhereRole<TModelName>;
  /**
   * `keys` maps local FK fields to the target policy's id fields. Hand-authored
   * policies must keep `relation` and `keys` consistent.
   */
  via: <
    R extends ToOneRelationKeys<TModelName>,
    TTargetIdField extends string,
    TTargetRoleName extends string,
  >(
    target: DelegationTarget<TTargetIdField, TTargetRoleName>,
    role: NoInfer<TTargetRoleName>,
    link: ViaLink<TModelName, R, TTargetIdField>,
  ) => ViaRole<TModelName>;
  /**
   * Existential delegation across a to-many relation — "SOME related row grants
   * `role`". No `keys`: there is no local FK, so the relation name alone
   * identifies the link. `relation` is constrained to relations that actually
   * point at the target policy's model — but only when the target's model is
   * statically known; a target passed as a bare `DelegationTarget` widens to
   * `ModelPropName` and accepts any to-many relation.
   */
  viaMany: <TTargetRoleName extends string, TTargetModel extends ModelPropName>(
    target: DelegationTarget<string, TTargetRoleName, TTargetModel>,
    role: NoInfer<TTargetRoleName>,
    relation: ToManyRelationKeysOf<TModelName, NoInfer<TTargetModel>>,
  ) => ViaManyRole<TModelName>;
  hasRole: (...roles: string[]) => HasRoleLeaf;
  authenticated: () => AuthenticatedLeaf;
  all: (parts: NonEmptyArray<RoleNode<TModelName>>) => AllRole<TModelName>;
  some: (parts: NonEmptyArray<RoleNode<TModelName>>) => SomeRole<TModelName>;
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
   * also bulk mutations / editable-rows lists.
   *
   * Always returns a filter — never `undefined`, which Prisma would read as
   * "no filter" if spread into a query. Unrestricted + no caller filter → `{}`
   * (Prisma-equivalent to omitting `where`); total-deny throws `ForbiddenError`.
   */
  where: (
    ctx: ServiceContext,
    callerWhere?: WhereInput<TModelName>,
  ) => WhereInput<TModelName>;
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
  /**
   * Existential form of {@link nestedWhere} — nests this role's where under a
   * to-many relation as `{ relation: { some: … } }`. An unrestricted role folds
   * to `{ some: {} }`, never `true`: a host with no related rows must not be
   * granted the role vacuously.
   */
  nestedWhereMany: (
    ctx: ServiceContext,
    relationField: string,
  ) => WhereResult<TModelName>;
}
