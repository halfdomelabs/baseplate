// @ts-nocheck

import type {
  ActionGrant,
  ActionMembers,
  AuthoredRole,
  DelegationTarget,
  Exists,
  ModelDelegate,
  PolicyRoleMembers,
  RoleBuilder,
  RoleNode,
} from '$types';
import type {
  GetResult,
  ModelPropName,
  WhereInput,
  WhereUniqueInput,
} from '%dataUtilsImports';
import type { WhereResult } from '%prismaQueryFilterUtilsImports';
import type { ServiceContext } from '%serviceContextImports';

import { ForbiddenError } from '%errorHandlerServiceImports';
import { queryHelpers } from '%prismaQueryFilterUtilsImports';

type MatchValue = string | number | bigint | boolean | null;

/**
 * `undefined` must never reach Prisma because Prisma omits that field, which
 * would widen the authorization filter.
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
 * Look up a role's members on a delegation target. `via`/`viaMany` validate the
 * role exists at construction time (see `RoleBuilder.via`/`viaMany`), so a miss
 * here means the target policy changed shape after construction.
 */
function getTargetRole(
  target: DelegationTarget,
  role: string,
): DelegationTarget['roles'][string] {
  const members = target.roles[role];
  if (!members) {
    throw new Error(
      `Delegation target '${target.model}' does not define role '${role}'.`,
    );
  }
  return members;
}

/** Memoize an async set for the duration of a request. */
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

function hasGlobalRole(
  ctx: ServiceContext,
  globalRoles: readonly string[],
): boolean {
  return globalRoles.length > 0 && ctx.auth.hasSomeRole(globalRoles as never);
}

/** Cache a boolean per request and coalesce concurrent evaluations. */
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
  TIdField extends string = TId extends readonly (infer F extends string)[]
    ? F
    : TId & string,
>(config: {
  model: TModelName;
  id: TId;
  delegate: ModelDelegate<TModelName>;
  superuser?: string[];
  roles: (r: RoleBuilder<TModelName>) => TRoles;
  actions: TActions;
}): {
  readonly model: TModelName;
  readonly idFields: readonly TIdField[];
  readonly roles: {
    readonly [K in keyof TRoles]: PolicyRoleMembers<TModelName, TIdField>;
  };
  readonly actions: {
    readonly [K in keyof TActions]: ActionMembers<TModelName>;
  };
} {
  const superuser = config.superuser ?? [];
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
      if (!Object.hasOwn(target.roles, role)) {
        throw new Error(
          `r.via('${role}', relation '${link.relation}'): target policy does not define role '${role}'.`,
        );
      }
      const mappings = Object.entries(link.keys);
      const targetFields = mappings.map(([, targetField]) => targetField);
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
    viaMany: (target, role, relation) => {
      if (!Object.hasOwn(target.roles, role)) {
        throw new Error(
          `r.viaMany('${role}', relation '${relation}'): target policy does not define role '${role}'.`,
        );
      }
      return { kind: 'viaMany', target, role, relation };
    },
    all: (parts) => {
      if (parts.length === 0) {
        throw new Error(
          'r.all requires at least one part (empty → allow-all).',
        );
      }
      return { kind: 'all', parts };
    },
    some: (parts) => {
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

  const delegate = config.delegate as unknown as {
    count: (args: {
      where: NonNullable<WhereInput<TModelName>>;
    }) => Promise<number>;
  };
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

  /** Return `null` when an optional foreign key cannot identify a target row. */
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
    if (values.some((entry) => entry[2] === null || entry[2] === undefined)) {
      return null;
    }
    const ids: Record<string, string | number> = {};
    for (const [localField, targetField, value] of values) {
      assertIdValue(localField, value);
      ids[targetField] = value;
    }
    return ids;
  }

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
        return getTargetRole(node.target, node.role).nestedWhere(
          ctx,
          node.relation,
        );
      }
      case 'viaMany': {
        return getTargetRole(node.target, node.role).nestedWhereMany(
          ctx,
          node.relation,
        );
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
        const targetIds = buildTargetIds(node.keys, model);
        if (targetIds === null) return false;
        return getTargetRole(node.target, node.role).checkById(ctx, targetIds);
      }
      case 'viaMany': {
        // No local FK to read, so don't load or iterate the relation. Probe THIS
        // model by its own id(s) with the same nested filter the where form
        // uses — one query, and the two forms provably cannot drift.
        const where = whereNode(ctx, node, key);
        // No `true` guard here, unlike `where`/`userWhere`: `nestedWhereMany`
        // folds an unrestricted target to `{ some: {} }`, so this can only be
        // `false` or an object. Don't "restore" the guard — returning `true`
        // would be exactly the vacuous grant that fold exists to prevent.
        if (where === false) return false;
        const ids = buildIds(model);
        return cachedBoolean(ctx, roleCacheKey(ids, key), () =>
          exists(ctx, ids, where),
        );
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

  /**
   * Look up a role node authored via `config.roles`. Callers only ever pass a
   * role name sourced from `TRoles` (`Object.keys(authored)` or a
   * `keyof TRoles`-constrained action grant), so a miss means the caller
   * passed a role this policy never authored.
   */
  function getAuthoredRole(role: string): RoleNode<TModelName> {
    const node = authored[role];
    if (!node) {
      throw new Error(
        `createModelPolicy('${config.model}') has no role '${role}'.`,
      );
    }
    return node;
  }

  const roleWhere = (
    ctx: ServiceContext,
    role: string,
  ): WhereResult<TModelName> => whereNode(ctx, getAuthoredRole(role), role);

  const checkRole = (
    ctx: ServiceContext,
    role: string,
    model: GetResult<TModelName>,
  ): Promise<boolean> => checkNode(ctx, getAuthoredRole(role), role, model);

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
      nestedWhereMany: (ctx, relationField) => {
        const w = roleWhere(ctx, roleName);
        // Total deny stays a deny. But an UNRESTRICTED role must still require a
        // related row — `{ some: {} }`, never `true`, or a host with no related
        // rows would be granted the role vacuously.
        if (w === false) return false;
        return { [relationField]: { some: w === true ? {} : w } };
      },
    };
  }

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

  const actionMembers = Object.fromEntries(
    Object.entries(config.actions).map(([action, grant]) => [
      action,
      buildAction(grant),
    ]),
  ) as {
    [K in keyof TActions]: ActionMembers<TModelName>;
  };

  return {
    model: config.model,
    idFields,
    roles: roleMembers,
    actions: actionMembers,
  };
}
