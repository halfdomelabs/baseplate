import type {
  GetResult,
  ModelPropName,
  WhereInput,
  WhereUniqueInput,
} from '../data-operations/prisma-types.js';
import type { WhereResult } from '../query-helpers.js';
import type { ServiceContext } from '../service-context.js';
import type {
  ActionGrant,
  ActionMembers,
  AuthoredRole,
  Exists,
  ModelDelegate,
  PolicyRoleMembers,
  RoleBuilder,
  RoleNode,
} from './types.js';

import { ForbiddenError } from '../http-errors.js';
import { queryHelpers } from '../query-helpers.js';

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
  const TId extends
    | (keyof GetResult<TModelName> & string)
    | readonly (keyof GetResult<TModelName> & string)[],
  const TRoles extends Record<string, AuthoredRole<TModelName>>,
  const TActions extends {
    // `read` is REQUIRED — a model with no read grant leaks by default, so "who
    // can read this?" must be a decision, not an omission. Close an action with
    // an EMPTY grant (`{ roles: [] }`): implicit deny, but superuser still folds
    // in (no absolute-deny; narrow `superuser` to lock admins out).
    read: ActionGrant<Extract<keyof TRoles, string>>;
  } & Record<string, ActionGrant<Extract<keyof TRoles, string>>>,
  // Normalize `TId` (a single field name OR an array of them) to the literal
  // union of field names, for `PolicyRoleMembers`'/`DelegationTarget`'s
  // `TIdField` — e.g. `'id'` stays `'id'`; `['tenantId', 'userId']` becomes
  // `'tenantId' | 'userId'`.
  TIdField extends string = TId extends readonly (infer F extends string)[]
    ? F
    : TId & string,
>(config: {
  model: TModelName;
  /** Primary key field(s). A single name for a scalar PK, or an array for a composite PK. */
  id: TId;
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
  readonly idFields: readonly TIdField[];
  readonly roles: {
    readonly [K in keyof TRoles]: PolicyRoleMembers<TModelName, TIdField>;
  };
} & { readonly [K in keyof TActions]: ActionMembers<TModelName> } {
  const superuser = config.superuser ?? [];
  // Frozen + copied so a caller's mutation of the original array/config after
  // construction can't retroactively invalidate the checks just below.
  const idFields: readonly TIdField[] = Object.freeze(
    (Array.isArray(config.id)
      ? config.id.slice()
      : [config.id]) as unknown as TIdField[],
  );
  if (idFields.length === 0) {
    throw new Error(
      `createModelPolicy('${config.model}'): \`id\` must name at least one field.`,
    );
  }

  const builder: RoleBuilder<TModelName> = {
    match: (match) => ({ kind: 'match', match }),
    userMatch: (userMatch) => ({ kind: 'userMatch', userMatch }),
    where: (where) => ({ kind: 'where', where }),
    userWhere: (userWhere) => ({ kind: 'userWhere', userWhere }),
    via: (target, role, link) => {
      const mappings = Object.entries(link.keys);
      const targetFields = mappings.map(([, targetField]) => targetField);
      // Every mapping must have a value, one mapping per target id field (no
      // dropped/duplicate coverage — a duplicate target field would silently
      // let one mapping overwrite another's contribution in `buildTargetIds`).
      const isValid =
        targetFields.every((f): f is string => f !== undefined) &&
        targetFields.length === target.idFields.length &&
        new Set(targetFields).size === targetFields.length &&
        target.idFields.every((f) => targetFields.includes(f));
      if (!isValid) {
        throw new Error(
          `r.via('${role}', relation '${link.relation}'): \`keys\` targets [${targetFields.join(', ')}], ` +
            `but the target policy's id fields are [${target.idFields.join(', ')}]. ` +
            `\`keys\` must map each local field to exactly ONE of the target's id fields, with no duplicates or gaps.`,
        );
      }
      return {
        kind: 'via',
        target,
        role,
        keys: Object.freeze({ ...link.keys }),
        relation: link.relation,
      };
    },
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
  const delegate = config.delegate as unknown as {
    count: (args: {
      where: NonNullable<WhereInput<TModelName>>;
    }) => Promise<number>;
  };
  /** An id field's value must be a definite scalar — never null/undefined/bigint. */
  function assertIdValue(
    field: string,
    value: unknown,
  ): asserts value is string | number {
    if (typeof value !== 'string' && typeof value !== 'number') {
      throw new TypeError(
        `createModelPolicy('${config.model}'): id field '${field}' resolved to ` +
          `${value === null ? 'null' : value === undefined ? 'undefined' : typeof value}, ` +
          'not a string or number. Every id field must be a loaded scalar.',
      );
    }
  }

  /** Project a loaded row down to its OWN id field(s) as a field-name → value map. */
  function buildIds(
    model: Record<string, unknown>,
  ): Record<string, string | number> {
    const ids: Record<string, string | number> = {};
    for (const field of idFields) {
      const value = model[field];
      assertIdValue(field, value);
      ids[field] = value;
    }
    return ids;
  }

  /**
   * Project a loaded row down to the TARGET's id field(s), via a `keys`
   * local→target map — e.g. `{ blogId: 'id' }` on a `BlogPost` row produces
   * `{ id: row.blogId }`, the shape the target's OWN `checkById` expects.
   *
   * An OPTIONAL relation's unset FK (every mapped local value null/undefined)
   * returns `null` — "relation not set", matching how the `.where` path's
   * `nestedWhere` behaves (Prisma's own relation filter just doesn't match an
   * absent relation, it doesn't error). A PARTIALLY-null composite FK (some
   * columns set, some not) is corrupt data, not an absent relation — that
   * still throws via `assertIdValue`.
   */
  function buildTargetIds(
    keys: Record<string, string | undefined>,
    model: Record<string, unknown>,
  ): Record<string, string | number> | null {
    const values = Object.entries(keys)
      .filter((entry): entry is [string, string] => entry[1] !== undefined)
      .map(
        ([localField, targetField]) =>
          [localField, targetField, model[localField]] as const,
      );
    if (values.every((entry) => entry[2] === null || entry[2] === undefined)) {
      return null;
    }
    const ids: Record<string, string | number> = {};
    for (const [localField, targetField, value] of values) {
      assertIdValue(localField, value);
      ids[targetField] = value;
    }
    return ids;
  }

  /**
   * Validate an id map's key set is EXACTLY a model's declared id fields (no
   * partial/extra/empty maps) AND that every expected field's value is a
   * definite scalar — closes the gap where a bypassed-TS caller could pass a
   * key with an `undefined` value, which Prisma treats as an omitted filter
   * (silently widening the match to "any row").
   */
  function assertIdsComplete(
    ids: Record<string, unknown>,
    expectedFields: readonly string[],
  ): asserts ids is Record<string, string | number> {
    const actual = new Set(Object.keys(ids));
    const expected = new Set(expectedFields);
    const matches =
      actual.size === expected.size &&
      [...actual].every((f) => expected.has(f));
    if (!matches) {
      throw new Error(
        `createModelPolicy('${config.model}'): expected an id map with exactly ` +
          `[${expectedFields.join(', ')}], got [${[...actual].join(', ')}].`,
      );
    }
    for (const field of expectedFields) {
      assertIdValue(field, ids[field]);
    }
  }

  const exists: Exists<TModelName> = (_ctx, ids, where) =>
    delegate
      .count({
        where: {
          AND: [ids, where],
        },
      })
      .then((n) => n > 0);

  /**
   * Deterministic, collision-proof cache key for an id map — sorted `[k, v]`
   * pairs through `JSON.stringify` so no delimiter choice can let two distinct
   * id maps encode to the same string (unlike a hand-joined `k=v,k=v` scheme,
   * where a value containing `,`/`=` can forge another map's key).
   */
  function idsCacheKey(ids: Record<string, string | number>): string {
    return JSON.stringify(
      Object.keys(ids)
        .toSorted()
        .map((k) => [k, ids[k]]),
    );
  }

  function roleCacheKey(
    ids: Record<string, string | number>,
    role: string,
  ): string {
    return `authz:${config.model}:role:${role}:${idsCacheKey(ids)}`;
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
      n.kind === 'match' ||
      n.kind === 'userMatch' ||
      n.kind === 'hasRole' ||
      n.kind === 'authenticated'
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
        validateMatch(m, key);
        return m;
      }
      case 'userMatch': {
        // Deny BEFORE invoking the callback if unauthenticated — the callback's
        // session is guaranteed `type: 'user'` (non-null `userId`).
        const { session } = ctx.auth;
        if (session?.type !== 'user') return false;
        const m = node.userMatch(session, ctx);
        if (m === false) return false;
        validateMatch(m, key);
        return m;
      }
      case 'via': {
        return node.target.roles[node.role].nestedWhere(ctx, node.relation);
      }
      case 'where': {
        return assertNotUndefined(node.where(ctx), key);
      }
      case 'userWhere': {
        const { session } = ctx.auth;
        if (session?.type !== 'user') return false;
        return assertNotUndefined(node.userWhere(session, ctx), key);
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
        return evaluateMatch(m, model, key);
      }
      case 'userMatch': {
        const { session } = ctx.auth;
        if (session?.type !== 'user') return false;
        const m = node.userMatch(session, ctx);
        if (m === false) return false;
        return evaluateMatch(m, model, key);
      }
      case 'via': {
        // Delegation: parent's cached checkById, keyed on the TARGET id(s) → N
        // children of one parent collapse to 1 query, even concurrently.
        const targetIds = buildTargetIds(node.keys, model);
        // Unset optional relation → deny, matching `nestedWhere`'s "absent
        // relation doesn't match" semantics on the `.where` path (no query).
        if (targetIds === null) return false;
        return node.target.roles[node.role].checkById(ctx, targetIds);
      }
      case 'where': {
        const where = assertNotUndefined(node.where(ctx), key);
        if (where === true) return true;
        if (where === false) return false;
        const ids = buildIds(model);
        return cachedBoolean(ctx, roleCacheKey(ids, key), () =>
          exists(ctx, ids, where),
        );
      }
      case 'userWhere': {
        const { session } = ctx.auth;
        if (session?.type !== 'user') return false;
        const where = assertNotUndefined(node.userWhere(session, ctx), key);
        if (where === true) return true;
        if (where === false) return false;
        const ids = buildIds(model);
        return cachedBoolean(ctx, roleCacheKey(ids, key), () =>
          exists(ctx, ids, where),
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
    ids: Record<string, string | number>,
  ): Promise<boolean> {
    // Reject a partial/extra/empty id map BEFORE it reaches `exists()` — a
    // partial map there would silently widen the filter to "any row".
    assertIdsComplete(ids, idFields);
    // Resolve to a single where (an `all` folds to a conjoined where via
    // roleWhere) and probe by id(s), coalesced on the shared key.
    const where = roleWhere(ctx, role);
    if (where === true) return Promise.resolve(true);
    if (where === false) return Promise.resolve(false);
    return cachedBoolean(ctx, roleCacheKey(ids, role), () =>
      exists(ctx, ids, where),
    );
  }

  const roleMembers = {} as {
    [K in keyof TRoles]: PolicyRoleMembers<TModelName>;
  };
  for (const roleName of Object.keys(authored) as (keyof TRoles & string)[]) {
    roleMembers[roleName] = {
      check: (ctx, model) => checkRole(ctx, roleName, model),
      checkById: (ctx, ids) => checkRoleById(ctx, roleName, ids),
      assertById: async (ctx, ids) => {
        if (!(await checkRoleById(ctx, roleName, ids))) {
          throw new ForbiddenError(
            `Forbidden: requires role '${roleName}' on '${config.model}' ${idsCacheKey(ids)}.`,
          );
        }
      },
      nestedWhere: (ctx, relationField) => {
        const w = roleWhere(ctx, roleName);
        if (w === true) return true;
        if (w === false) return false;
        // via is to-one only → direct nesting `{ relation: w }`, no `{ some }`.
        return { [relationField]: w };
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
    return { AND: [callerWhere, authWhere] };
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
    idFields,
    roles: roleMembers,
    ...actionMembers,
  };
}
