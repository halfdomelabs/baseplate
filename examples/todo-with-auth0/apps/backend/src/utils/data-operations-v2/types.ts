import type { GlobalRoleCheck, InstanceRoleCheck } from '../authorizers.js';
import type {
  GetPayload,
  ModelPropName,
  ModelQuery,
  WhereUniqueInput,
} from '../data-operations/prisma-types.js';
import type {
  AnyFieldDefinition,
  AnyOperationHooks,
  InferFieldsCreateOutput,
  InferFieldsUpdateOutput,
  InferInput,
  PrismaTransaction,
} from '../data-operations/types.js';
import type { ServiceContext } from '../service-context.js';

type HookPhase = keyof Required<AnyOperationHooks>;
type HookFn<TPhase extends HookPhase> =
  Required<AnyOperationHooks>[TPhase][number];

// =========================================
// Operation Plans
// =========================================

/**
 * Immutable plan for a create operation, returned by `composeCreate`.
 *
 * Contains the resolved field data, collected hooks, and service context.
 * Use `mapData` and `addHook` to derive new plans — the original is never mutated.
 */
export class CreatePlan<
  TModelName extends ModelPropName,
  TFields extends Record<string, AnyFieldDefinition>,
> {
  /** The Prisma model name */
  readonly model: TModelName;

  /** Resolved field data for the create operation */
  readonly data: InferFieldsCreateOutput<TFields>;

  /** Collected hooks from field processing and any `addHook` calls */
  readonly hooks: Readonly<Required<AnyOperationHooks>>;

  /** Service context for the operation */
  readonly serviceContext: ServiceContext;

  constructor(args: {
    model: TModelName;
    data: InferFieldsCreateOutput<TFields>;
    hooks: Required<AnyOperationHooks>;
    serviceContext: ServiceContext;
  }) {
    this.model = args.model;
    this.data = args.data;
    this.hooks = args.hooks;
    this.serviceContext = args.serviceContext;
  }

  /** Return a new plan with transformed data. */
  mapData(
    fn: (
      data: InferFieldsCreateOutput<TFields>,
    ) => InferFieldsCreateOutput<TFields>,
  ): CreatePlan<TModelName, TFields> {
    return new CreatePlan({
      model: this.model,
      data: fn(this.data),
      hooks: this.hooks,
      serviceContext: this.serviceContext,
    });
  }

  /** Return a new plan with an additional hook appended to the given phase. */
  addHook<TPhase extends HookPhase>(
    phase: TPhase,
    hook: HookFn<TPhase>,
  ): CreatePlan<TModelName, TFields> {
    return new CreatePlan({
      model: this.model,
      data: this.data,
      hooks: {
        ...this.hooks,
        [phase]: [...this.hooks[phase], hook],
      },
      serviceContext: this.serviceContext,
    });
  }
}

/**
 * Immutable plan for an update operation, returned by `composeUpdate`.
 *
 * Contains the resolved field data, collected hooks, existing item access,
 * and service context. Use `mapData` and `addHook` to derive new plans —
 * the original is never mutated.
 */
export class UpdatePlan<
  TModelName extends ModelPropName,
  TFields extends Record<string, AnyFieldDefinition>,
> {
  /** The Prisma model name */
  readonly model: TModelName;

  /** Resolved field data for the update operation */
  readonly data: InferFieldsUpdateOutput<TFields>;

  /** Collected hooks from field processing and any `addHook` calls */
  readonly hooks: Readonly<Required<AnyOperationHooks>>;

  /** Service context for the operation */
  readonly serviceContext: ServiceContext;

  /**
   * Lazy loader for the existing item. Caches the result.
   * Call this if you need to inspect the existing item for diffing.
   */
  readonly loadExisting: () => Promise<GetPayload<TModelName>>;

  constructor(args: {
    model: TModelName;
    data: InferFieldsUpdateOutput<TFields>;
    hooks: Required<AnyOperationHooks>;
    serviceContext: ServiceContext;
    loadExisting: () => Promise<GetPayload<TModelName>>;
  }) {
    this.model = args.model;
    this.data = args.data;
    this.hooks = args.hooks;
    this.serviceContext = args.serviceContext;
    this.loadExisting = args.loadExisting;
  }

  /** Return a new plan with transformed data. */
  mapData(
    fn: (
      data: InferFieldsUpdateOutput<TFields>,
    ) => InferFieldsUpdateOutput<TFields>,
  ): UpdatePlan<TModelName, TFields> {
    return new UpdatePlan({
      model: this.model,
      data: fn(this.data),
      hooks: this.hooks,
      serviceContext: this.serviceContext,
      loadExisting: this.loadExisting,
    });
  }

  /** Return a new plan with an additional hook appended to the given phase. */
  addHook<TPhase extends HookPhase>(
    phase: TPhase,
    hook: HookFn<TPhase>,
  ): UpdatePlan<TModelName, TFields> {
    return new UpdatePlan({
      model: this.model,
      data: this.data,
      hooks: {
        ...this.hooks,
        [phase]: [...this.hooks[phase], hook],
      },
      serviceContext: this.serviceContext,
      loadExisting: this.loadExisting,
    });
  }
}

// =========================================
// Compose Configs
// =========================================

/**
 * Configuration for `composeCreate`.
 */
export interface ComposeCreateConfig<
  TModelName extends ModelPropName,
  TFields extends Record<string, AnyFieldDefinition>,
> {
  model: TModelName;
  fields: TFields;
  input: InferInput<TFields>;
  context: ServiceContext;

  /**
   * Optional authorization checks. Only global roles are allowed for create
   * since there is no existing instance to check against.
   * Runs before field processing — fails fast on unauthorized access.
   */
  authorize?: GlobalRoleCheck[];
}

/**
 * Configuration for `composeUpdate`.
 *
 * The `loadExisting` function is a cached lazy loader for the existing item.
 * It is called by field processing (e.g., nested relations) when they need
 * to read the current state. The caller defines this function to control
 * how the item is fetched (e.g., with extra includes).
 */
export interface ComposeUpdateConfig<
  TModelName extends ModelPropName,
  TFields extends Record<string, AnyFieldDefinition>,
> {
  model: TModelName;
  fields: TFields;
  input: Partial<InferInput<TFields>>;
  context: ServiceContext;
  loadExisting: () => Promise<GetPayload<TModelName>>;

  /**
   * Optional authorization checks. Supports both global roles (strings)
   * and instance-level checks (functions that receive the existing item).
   * Runs before field processing — fails fast on unauthorized access.
   */
  authorize?: (
    | GlobalRoleCheck
    | InstanceRoleCheck<GetPayload<TModelName>>
  )[];
}

// =========================================
// Data Service Input Types
// =========================================

/**
 * Input type for data service create functions.
 */
export interface DataCreateInput<
  TModelName extends ModelPropName,
  TFields extends Record<string, AnyFieldDefinition>,
  TQueryArgs extends ModelQuery<TModelName> = object,
> {
  data: InferInput<TFields>;
  query?: TQueryArgs;
  context: ServiceContext;
}

/**
 * Input type for data service update functions.
 */
export interface DataUpdateInput<
  TModelName extends ModelPropName,
  TFields extends Record<string, AnyFieldDefinition>,
  TQueryArgs extends ModelQuery<TModelName> = object,
> {
  where: WhereUniqueInput<TModelName>;
  data: Partial<InferInput<TFields>>;
  query?: TQueryArgs;
  context: ServiceContext;
}

/**
 * Input type for data service delete functions.
 */
export interface DataDeleteInput<
  TModelName extends ModelPropName,
  TQueryArgs extends ModelQuery<TModelName> = object,
> {
  where: WhereUniqueInput<TModelName>;
  query?: TQueryArgs;
  context: ServiceContext;
}

// =========================================
// Commit Configs
// =========================================

/**
 * Configuration for `commitCreate`.
 */
export interface CommitCreateConfig<
  TModelName extends ModelPropName,
  TFields extends Record<string, AnyFieldDefinition>,
  TQueryArgs extends ModelQuery<TModelName>,
> {
  /** Prisma query arguments (include) to shape returned data */
  query?: TQueryArgs;

  /**
   * Optional override for the default refetch behavior.
   * By default, records are refetched using `findUnique({ where: { id } })`
   * via a generic Prisma delegate. Provide this if you need custom refetch logic.
   */
  refetchWithQuery?: (
    result: GetPayload<TModelName>,
    query: TQueryArgs,
  ) => Promise<GetPayload<TModelName>>;

  /** Execute the Prisma create operation inside the transaction */
  execute: (args: {
    tx: PrismaTransaction;
    data: InferFieldsCreateOutput<TFields>;
    query: { include: NonNullable<TQueryArgs['include']> };
    serviceContext: ServiceContext;
  }) => Promise<GetPayload<TModelName>>;
}

/**
 * Configuration for `commitUpdate`.
 */
export interface CommitUpdateConfig<
  TModelName extends ModelPropName,
  TFields extends Record<string, AnyFieldDefinition>,
  TQueryArgs extends ModelQuery<TModelName>,
> {
  /** Prisma query arguments (include) to shape returned data */
  query?: TQueryArgs;

  /**
   * Re-fetch the updated record with query includes after hooks have run.
   * Required when `query` is provided with includes, otherwise the re-fetch
   * after post-execute hooks cannot return the correct shape.
   */
  refetchWithQuery?: (
    result: GetPayload<TModelName>,
    query: TQueryArgs,
  ) => Promise<GetPayload<TModelName>>;

  /** Execute the Prisma update operation inside the transaction */
  execute: (args: {
    tx: PrismaTransaction;
    data: InferFieldsUpdateOutput<TFields>;
    query: { include: NonNullable<TQueryArgs['include']> };
    serviceContext: ServiceContext;
  }) => Promise<GetPayload<TModelName>>;
}

/**
 * Configuration for `commitDelete`.
 *
 * Delete has no compose step since there are no fields to process.
 * Authorization, hooks, and execution are all handled directly.
 */
export interface CommitDeleteConfig<
  TModelName extends ModelPropName,
  TQueryArgs extends ModelQuery<TModelName>,
> {
  /** The Prisma model name */
  model: TModelName;

  /** Where clause to identify the record to delete */
  where: WhereUniqueInput<TModelName>;

  /** Prisma query arguments (include) to shape returned data */
  query?: TQueryArgs;

  /** Service context for the operation */
  context: ServiceContext;

  /**
   * Optional authorization checks. Supports both global roles (strings)
   * and instance-level checks (functions that receive the existing item).
   * Runs before hooks and delete execution.
   */
  authorize?: (
    | GlobalRoleCheck
    | InstanceRoleCheck<GetPayload<TModelName>>
  )[];

  /** Optional hooks to run during the delete lifecycle */
  hooks?: Partial<AnyOperationHooks>;

  /**
   * Lazy loader for the existing item. Required when using instance-level
   * authorization or hooks that need to inspect the record before deletion.
   * The result is cached so the item is fetched at most once.
   */
  loadExisting?: () => Promise<GetPayload<TModelName>>;

  /** Execute the Prisma delete operation inside the transaction */
  execute: (args: {
    tx: PrismaTransaction;
    where: WhereUniqueInput<TModelName>;
    query: { include: NonNullable<TQueryArgs['include']> };
    serviceContext: ServiceContext;
  }) => Promise<GetPayload<TModelName>>;
}
