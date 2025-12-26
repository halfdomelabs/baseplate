// @ts-nocheck

import type { AuthRole } from '%authRolesImports';
import type { GetPayload, ModelPropName } from '%dataUtilsImports';
import type { ServiceContext } from '%serviceContextImports';

import { ForbiddenError } from '%errorHandlerServiceImports';

// ============================================================================
// Role Check Types
// ============================================================================

/**
 * Instance role check - requires the model instance.
 * Used for checking ownership or other instance-specific permissions.
 *
 * @example
 * ```typescript
 * const ownerCheck: InstanceRoleCheck<User> = (ctx, model) =>
 *   model.id === ctx.auth.userId;
 * ```
 */
export type InstanceRoleCheck<TInstance> = (
  ctx: ServiceContext,
  instance: TInstance,
) => Promise<boolean> | boolean;

// ============================================================================
// Authorization Check Helpers
// ============================================================================

/**
 * Checks if any global role check passes for the given context.
 *
 * @param ctx - Service context
 * @param authorize - Array of role strings
 * @throws {ForbiddenError} If no role check passes
 *
 * @example
 * ```typescript
 * checkGlobalAuthorization(ctx, ['admin', 'user']);
 * ```
 */
export function checkGlobalAuthorization(
  ctx: ServiceContext,
  authorize: AuthRole[],
): void {
  if (!ctx.auth.hasSomeRole(authorize)) {
    throw new ForbiddenError('Forbidden');
  }
}

/**
 * Checks if any role check passes for the given context and instance.
 * Global roles (strings) are checked first with hasSomeRole for efficiency.
 * Instance checks (functions) are run sequentially with lazy instance loading.
 *
 * @param ctx - Service context
 * @param instance - Instance to check against, or a function that loads it lazily
 * @param authorize - Array of roles (string for global role or function for instance check)
 * @throws {ForbiddenError} If no role check passes
 *
 * @example
 * ```typescript
 * // With direct instance
 * await checkInstanceAuthorization(ctx, user, ['admin', userAuthorizer.roles.owner]);
 *
 * // With lazy loader (instance only loaded if needed)
 * await checkInstanceAuthorization(ctx, () => loadUser(id), ['admin', userAuthorizer.roles.owner]);
 * ```
 */
export async function checkInstanceAuthorization<T>(
  ctx: ServiceContext,
  instance: T | (() => Promise<T>),
  authorize: (InstanceRoleCheck<T> | AuthRole)[],
): Promise<void> {
  // Split into global roles (strings) and instance checks (functions)
  const globalRoles = authorize.filter(
    (check): check is AuthRole => typeof check === 'string',
  );
  const instanceChecks = authorize.filter(
    (check): check is InstanceRoleCheck<T> => typeof check === 'function',
  );

  // Check global roles first (no instance needed)
  if (globalRoles.length > 0 && ctx.auth.hasSomeRole(globalRoles)) {
    return;
  }

  // Run instance checks sequentially with lazy loading
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

// ============================================================================
// Model Authorizer
// ============================================================================

/**
 * Configuration for creating a model authorizer.
 */
export interface ModelAuthorizerConfig<
  TModelName extends ModelPropName,
  TRoles extends Record<string, InstanceRoleCheck<GetPayload<TModelName>>>,
> {
  /** Prisma model name */
  model: TModelName;

  /** Field used as the primary key */
  idField: keyof GetPayload<TModelName>;

  /** Function to load model by ID */
  getModelById: (id: string) => Promise<GetPayload<TModelName> | null>;

  /** Role check functions - "who you are" relative to this resource */
  roles: TRoles;
}

/**
 * Model authorizer interface - a registry of role check functions.
 */
export interface ModelAuthorizer<
  TModelName extends ModelPropName,
  TRoles extends Record<string, InstanceRoleCheck<GetPayload<TModelName>>>,
> {
  /** The model name */
  readonly model: TModelName;

  /**
   * Role check functions that can be used in authorize arrays.
   * Each role is a pure function: (ctx, model) => boolean
   *
   * @example
   * ```typescript
   * authorize: ['admin', userAuthorizer.roles.owner]
   * ```
   */
  readonly roles: Readonly<TRoles>;

  /**
   * Check if user has a specific role on a model.
   * Results are cached per request.
   */
  hasRole(
    ctx: ServiceContext,
    model: GetPayload<TModelName>,
    role: keyof TRoles,
  ): Promise<boolean>;

  /**
   * Check if user has a specific role by model ID.
   * Loads the model if not cached, then checks the role.
   */
  hasRoleById(
    ctx: ServiceContext,
    id: string,
    role: keyof TRoles,
  ): Promise<boolean>;
}

/**
 * Creates a model authorizer - a registry of role check functions.
 *
 * @example
 * ```typescript
 * const userAuthorizer = createModelAuthorizer({
 *   model: 'user',
 *   idField: 'id',
 *   getModelById: (id) => prisma.user.findUnique({ where: { id } }),
 *   roles: {
 *     owner: (ctx, model) => model.id === ctx.auth.userId,
 *     viewer: (ctx) => ctx.auth.hasRole('user'),
 *   },
 * });
 *
 * // Use in authorize arrays
 * authorize: ['admin', userAuthorizer.roles.owner]
 * ```
 */
export function createModelAuthorizer<
  TModelName extends ModelPropName,
  TRoles extends Record<string, InstanceRoleCheck<GetPayload<TModelName>>>,
>(
  config: ModelAuthorizerConfig<TModelName, TRoles>,
): ModelAuthorizer<TModelName, TRoles> {
  function getRoleCacheKey(id: string | number, role: keyof TRoles): string {
    return `authz:${config.model}:role:${String(role)}:${String(id)}`;
  }

  function getModelCacheKey(id: string): string {
    return `authz:${config.model}:model:${id}`;
  }

  function getIdFromModel(model: GetPayload<TModelName>): string | number {
    const id = model[config.idField];
    if (typeof id !== 'string' && typeof id !== 'number') {
      throw new TypeError(
        `Model ${config.model} id field ${String(config.idField)} is not a string or number`,
      );
    }
    return id;
  }

  function getRoleCheck(
    role: keyof TRoles,
  ): InstanceRoleCheck<GetPayload<TModelName>> {
    if (!(role in config.roles)) {
      throw new Error(`Role ${String(role)} not found`);
    }
    return config.roles[role];
  }

  // -------------------------------------------------------------------------
  // Role check implementations
  // -------------------------------------------------------------------------

  async function hasRoleWithModel(
    ctx: ServiceContext,
    model: GetPayload<TModelName>,
    role: keyof TRoles,
  ): Promise<boolean> {
    const id = getIdFromModel(model);
    const cacheKey = getRoleCacheKey(id, role);

    // Check cache first
    const cached = ctx.authorizerCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    // Run role check
    const roleCheck = getRoleCheck(role);
    const result = await Promise.resolve(roleCheck(ctx, model));

    // Cache and return
    ctx.authorizerCache.set(cacheKey, result);
    return result;
  }

  async function hasRoleByIdInternal(
    ctx: ServiceContext,
    id: string,
    role: keyof TRoles,
  ): Promise<boolean> {
    const cacheKey = getRoleCacheKey(id, role);

    // Check role cache first
    const cached = ctx.authorizerCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    // Check model cache or load model
    const modelCacheKey = getModelCacheKey(id);
    let model = ctx.authorizerModelCache.get(modelCacheKey) as
      | GetPayload<TModelName>
      | null
      | undefined;

    if (model === undefined) {
      model = await config.getModelById(id);
      // Cache model (including null for not found)
      ctx.authorizerModelCache.set(modelCacheKey, model);
    }

    if (!model) {
      // Cache negative result for missing models
      ctx.authorizerCache.set(cacheKey, false);
      return false;
    }

    // Run role check (will also cache)
    return hasRoleWithModel(ctx, model, role);
  }

  return {
    model: config.model,
    roles: config.roles,
    hasRole: hasRoleWithModel,
    hasRoleById: hasRoleByIdInternal,
  };
}
