import type { Payload } from '@prisma/client/runtime/client';
import type { z } from 'zod';

import { prisma } from '@src/services/prisma.js';

import type {
  CreateInput,
  GetPayload,
  ModelPropName,
  UpdateInput,
  WhereInput,
  WhereUniqueInput,
} from './prisma-types.js';
import type {
  AnyFieldDefinition,
  FieldDefinition,
  InferFieldsCreateOutput,
  InferFieldsUpdateOutput,
  InferInput,
  InferInputSchema,
  OperationContext,
  TransactionalOperationContext,
} from './types.js';

import {
  generateCreateSchema,
  invokeHooks,
  transformFields,
} from './define-operations.js';
import { makeGenericPrismaDelegate } from './prisma-utils.js';

/**
 * Create a simple scalar field with validation and optional transformation
 *
 * This helper creates a field definition that validates input using a Zod schema.
 * Optionally, you can provide a transform function to convert the validated value
 * into a different type for Prisma operations.
 *
 * For relation fields (e.g., `userId`), use this helper to validate the ID,
 * then use relation helpers in the transform step to create Prisma connect/disconnect objects.
 *
 * @template TSchema - The Zod schema type for validation
 * @template TTransformed - The output type after transformation (defaults to schema output)
 * @param schema - Zod schema for validation
 * @param options - Optional configuration
 * @param options.transform - Function to transform the validated value
 * @returns Field definition
 *
 * @example
 * ```typescript
 * // Simple validation
 * const fields = {
 *   title: scalarField(z.string()),
 *   ownerId: scalarField(z.string()), // Validated as string
 * };
 *
 * // With transformation
 * const fields = {
 *   email: scalarField(
 *     z.email(),
 *     { transform: (email) => email.toLowerCase() }
 *   ),
 *   createdAt: scalarField(
 *     z.string().datetime(),
 *     { transform: (dateStr) => new Date(dateStr) }
 *   ),
 * };
 * ```
 */
export function scalarField<
  TSchema extends z.ZodType,
  TTransformed = z.output<TSchema>,
>(
  schema: TSchema,
  options?: {
    transform?: (value: z.output<TSchema>) => TTransformed;
  },
): FieldDefinition<TSchema, TTransformed, TTransformed> {
  return {
    schema,
    processInput: (value) => {
      // Apply transform if provided
      const transformed = options?.transform
        ? options.transform(value)
        : (value as TTransformed);

      return {
        data: { create: transformed, update: transformed },
      };
    },
  };
}

/**
 * =========================================
 * Nested Field Handlers
 * =========================================
 */

/**
 * Configuration for a parent model in nested field definitions.
 *
 * Used to establish the relationship between a parent and child model
 * in nested one-to-one and one-to-many field handlers.
 *
 * @template TModelName - Prisma model name
 */
export interface ParentModelConfig<TModelName extends ModelPropName> {
  /** Prisma model name of the parent */
  model: TModelName;
  /** Function to extract unique identifier from parent model instance */
  getWhereUnique: (
    parentModel: GetPayload<TModelName>,
  ) => WhereUniqueInput<TModelName>;
}

/**
 * Creates a parent model configuration for use in nested field definitions.
 *
 * @template TModelName - Prisma model name
 * @param model - Prisma model name
 * @param getWhereUnique - Function to extract unique identifier from parent model
 * @returns Parent model configuration object
 *
 * @example
 * ```typescript
 * const parentModel = createParentModelConfig('user', (user) => ({
 *   id: user.id,
 * }));
 * ```
 */
export function createParentModelConfig<TModelName extends ModelPropName>(
  model: TModelName,
  getWhereUnique: (
    parentModel: GetPayload<TModelName>,
  ) => WhereUniqueInput<TModelName>,
): ParentModelConfig<TModelName> {
  return {
    model,
    getWhereUnique,
  };
}

type RelationName<TModelName extends ModelPropName> = keyof Payload<
  (typeof prisma)[TModelName]
>['objects'];

/**
 * Configuration for defining a nested one-to-one relationship field.
 *
 * One-to-one fields represent a single related entity that can be created,
 * updated, or deleted along with the parent entity. The field handler manages
 * the lifecycle of the nested entity automatically.
 *
 * @template TParentModelName - Parent model name
 * @template TModelName - Child model name
 * @template TRelationName - Relation field name on the child model
 * @template TFields - Field definitions for the nested entity
 */
export interface NestedOneToOneFieldConfig<
  TParentModelName extends ModelPropName,
  TModelName extends ModelPropName,
  TRelationName extends RelationName<TModelName>,
  TFields extends Record<string, AnyFieldDefinition>,
> {
  /**
   * Prisma model name of parent model
   */
  parentModel: ParentModelConfig<TParentModelName>;

  /**
   * Prisma model name of the child model
   */
  model: TModelName;

  /**
   * Relation name of the parent model from the child model
   */
  relationName: TRelationName;

  /**
   * Field definitions for the nested entity
   */
  fields: TFields;

  /**
   * Extract where unique from parent model
   */
  getWhereUnique: (
    parentModel: GetPayload<TParentModelName>,
  ) => WhereUniqueInput<TModelName>;

  /**
   * Transform validated create field data into final Prisma structure
   */
  buildCreateData: (
    data: InferFieldsCreateOutput<TFields> &
      Record<TRelationName, { connect: WhereUniqueInput<TParentModelName> }>,
    parentModel: GetPayload<TParentModelName>,
    ctx: TransactionalOperationContext<
      GetPayload<TModelName>,
      { hasResult: false }
    >,
  ) => CreateInput<TModelName> | Promise<CreateInput<TModelName>>;

  /**
   * Transform validated update field data into final Prisma structure
   */
  buildUpdateData: (
    data: InferFieldsUpdateOutput<TFields>,
    parentModel: GetPayload<TParentModelName>,
    ctx: TransactionalOperationContext<
      GetPayload<TModelName>,
      { hasResult: false }
    >,
  ) => UpdateInput<TModelName> | Promise<UpdateInput<TModelName>>;
}

/**
 * Create a nested one-to-one relationship field handler
 *
 * This helper creates a field definition for managing one-to-one nested relationships.
 * It handles nested field validation, transformation, and supports both create and update operations.
 *
 * The nested entity is created/updated via afterExecute hooks, allowing it to reference
 * the parent entity after it has been created.
 *
 * Behavior:
 * - **Provided value**: Upserts the nested entity (creates if new, updates if exists)
 * - **null**: Deletes the nested entity (update only)
 * - **undefined**: No change to nested entity
 *
 * @param config - Configuration object
 * @returns Field definition
 *
 * @example
 * ```typescript
 * const fields = {
 *   userProfile: nestedOneToOneField({
 *     parentModel: createParentModelConfig('user', (user) => ({ id: user.id })),
 *     model: 'userProfile',
 *     relationName: 'user',
 *     fields: {
 *       bio: scalarField(z.string()),
 *       avatar: fileField(avatarFileCategory),
 *     },
 *     getWhereUnique: (parent) => ({ userId: parent.id }),
 *     buildData: (data) => ({
 *       create: {
 *         bio: data.create.bio,
 *         avatar: data.create.avatar ? { connect: { id: data.create.avatar } } : undefined,
 *       },
 *       update: {
 *         bio: data.update.bio,
 *         avatar: data.update.avatar ? { connect: { id: data.update.avatar } } : undefined,
 *       },
 *     }),
 *   }),
 * };
 * ```
 */
export function nestedOneToOneField<
  TParentModelName extends ModelPropName,
  TModelName extends ModelPropName,
  TRelationName extends RelationName<TModelName>,
  TFields extends Record<string, AnyFieldDefinition>,
>(
  config: NestedOneToOneFieldConfig<
    TParentModelName,
    TModelName,
    TRelationName,
    TFields
  >,
): FieldDefinition<
  z.ZodOptional<z.ZodNullable<InferInputSchema<TFields>>>,
  undefined,
  undefined
> {
  return {
    schema: generateCreateSchema(config.fields).nullish(),
    processInput: async (value, processCtx) => {
      // Handle null - delete the relation if it exists
      if (value === null) {
        return {
          data: {
            create: undefined,
            update: undefined,
          },
          hooks: {
            afterExecute: [
              async (ctx) => {
                const whereUnique = config.getWhereUnique(
                  ctx.result as GetPayload<TParentModelName>,
                );
                const prismaDelegate = makeGenericPrismaDelegate(
                  ctx.tx,
                  config.model,
                );
                // Use deleteMany which is idempotent - won't error if no record exists
                await prismaDelegate.deleteMany({
                  where: expandWhereUnique(whereUnique),
                });
              },
            ],
          },
        };
      }

      // Handle undefined - no change
      if (value === undefined) {
        return { data: { create: undefined, update: undefined } };
      }

      let cachedExisting: GetPayload<TModelName> | undefined;
      async function loadExisting(): Promise<
        GetPayload<TModelName> | undefined
      > {
        if (cachedExisting) return cachedExisting;
        const existingParent = await processCtx.loadExisting();
        if (!existingParent) return undefined;
        const whereUnique = config.getWhereUnique(
          existingParent as GetPayload<TParentModelName>,
        );
        const prismaDelegate = makeGenericPrismaDelegate(prisma, config.model);
        cachedExisting =
          ((await prismaDelegate.findUnique({
            where: whereUnique,
          })) as GetPayload<TModelName> | null) ?? undefined;
        return cachedExisting;
      }

      // Process nested fields
      const { data, hooks } = await transformFields(config.fields, value, {
        serviceContext: processCtx.serviceContext,
        operation: 'upsert',
        allowOptionalFields: false,
        loadExisting: loadExisting as () => Promise<object | undefined>,
      });

      let newModelResult: GetPayload<TModelName> | undefined;

      return {
        data: {},
        hooks: {
          beforeExecute: [
            (ctx) => invokeHooks(hooks.beforeExecute, { ...ctx, loadExisting }),
          ],
          afterExecute: [
            async (ctx) => {
              const awaitedData =
                typeof data === 'function' ? await data(ctx.tx) : data;
              const whereUnique = config.getWhereUnique(
                ctx.result as GetPayload<TParentModelName>,
              );
              const parentWhereUnique = config.parentModel.getWhereUnique(
                ctx.result as GetPayload<TParentModelName>,
              );
              const sharedCtx = {
                ...ctx,
                operation: 'upsert' as const,
                loadExisting,
              };
              const [builtCreate, builtUpdate] = await Promise.all([
                config.buildCreateData(
                  {
                    ...awaitedData.create,
                    ...({
                      [config.relationName]: { connect: parentWhereUnique },
                    } as Record<
                      TRelationName,
                      { connect: WhereUniqueInput<TParentModelName> }
                    >),
                  },
                  ctx.result as GetPayload<TParentModelName>,
                  sharedCtx,
                ),
                config.buildUpdateData(
                  awaitedData.update,
                  ctx.result as GetPayload<TParentModelName>,
                  sharedCtx,
                ),
              ]);
              const prismaDelegate = makeGenericPrismaDelegate(
                ctx.tx,
                config.model,
              );

              newModelResult = await prismaDelegate.upsert({
                where: whereUnique,
                create: builtCreate,
                update: builtUpdate,
              });

              await invokeHooks(hooks.afterExecute, {
                ...ctx,
                loadExisting,
                result: newModelResult,
              });
            },
          ],
          afterCommit: [
            async (ctx) => {
              await invokeHooks(hooks.afterCommit, {
                ...ctx,
                loadExisting,
                result: newModelResult,
              });
            },
          ],
        },
      };
    },
  };
}

/**
 * Configuration for defining a nested one-to-many relationship field.
 *
 * One-to-many fields represent a collection of related entities that are synchronized
 * with the input array. The handler automatically:
 * - Creates new items without unique identifiers
 * - Updates existing items with unique identifiers
 * - Deletes items not present in the input array
 *
 * @template TParentModelName - Parent model name
 * @template TModelName - Child model name
 * @template TRelationName - Relation field name on the child model
 * @template TFields - Field definitions for each item in the collection
 */
export interface NestedOneToManyFieldConfig<
  TParentModelName extends ModelPropName,
  TModelName extends ModelPropName,
  TRelationName extends RelationName<TModelName>,
  TFields extends Record<string, AnyFieldDefinition>,
> {
  /**
   * Prisma model name of parent model
   */
  parentModel: ParentModelConfig<TParentModelName>;

  /**
   * Prisma model name of the child model
   */
  model: TModelName;

  /**
   * Relation name of the parent model from the child model
   */
  relationName: TRelationName;

  /**
   * Field definitions for the nested entity
   */
  fields: TFields;

  /**
   * Function to extract a unique where clause from the input data for a child item and
   * the parent model.
   * If it returns undefined, the item is considered a new item to be created.
   */
  getWhereUnique: (
    input: InferInput<TFields>,
    originalModel: GetPayload<TParentModelName>,
  ) => WhereUniqueInput<TModelName> | undefined;

  /**
   * Transform validated create field data into final Prisma structure for a single item.
   * The returned payload should not include the parent relation field, as it will be added automatically.
   */
  buildCreateData: (
    data: InferFieldsCreateOutput<TFields> &
      Record<TRelationName, { connect: WhereUniqueInput<TParentModelName> }>,
    parentModel: GetPayload<TParentModelName>,
    ctx: TransactionalOperationContext<
      GetPayload<TModelName> | undefined,
      { hasResult: false }
    >,
  ) => CreateInput<TModelName> | Promise<CreateInput<TModelName>>;

  /**
   * Transform validated update field data into final Prisma structure for a single item.
   */
  buildUpdateData: (
    data: InferFieldsUpdateOutput<TFields>,
    parentModel: GetPayload<TParentModelName>,
    ctx: TransactionalOperationContext<
      GetPayload<TModelName> | undefined,
      { hasResult: false }
    >,
  ) => UpdateInput<TModelName> | Promise<UpdateInput<TModelName>>;
}

/**
 * Converts a Prisma `WhereUniqueInput` into a plain `WhereInput`.
 *
 * Compound unique constraints arrive as synthetic keys (e.g., `userId_role: { userId, role }`),
 * while generic `where` filters need the flattened field structure. This normalization allows
 * composing unique constraints with parent-level filters when constructing delete conditions
 * in one-to-many relationships.
 *
 * @template TModelName - Prisma model name
 * @param whereUnique - Unique filter returned by `getWhereUnique`, or undefined for new items
 * @returns Normalized where filter or undefined if no usable fields exist
 *
 * @internal This function is used internally by nestedOneToManyField
 */
function expandWhereUnique<TModelName extends ModelPropName>(
  whereUnique: WhereUniqueInput<TModelName> | undefined,
): WhereInput<TModelName> | undefined {
  if (!whereUnique) return undefined;

  const entries = Object.entries(whereUnique as Record<string, unknown>).filter(
    ([, value]) => value !== undefined && value !== null,
  );

  if (entries.length === 0) return undefined;

  const [[key, value]] = entries;

  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as WhereInput<TModelName>;
  }

  return { [key]: value as unknown } as WhereInput<TModelName>;
}

/**
 * Creates a nested one-to-many relationship field handler.
 *
 * This helper manages collections of child entities by synchronizing them with the input array.
 * The synchronization logic:
 * - **Update**: Items with unique identifiers (from `getWhereUnique`) are updated
 * - **Create**: Items without unique identifiers are created as new records
 * - **Delete**: Existing items not present in the input array are removed
 * - **No Change**: Passing `undefined` leaves the collection unchanged
 *
 * All operations are performed atomically within the parent operation's transaction,
 * ensuring data consistency even if the operation fails.
 *
 * @template TParentModelName - Parent model name
 * @template TModelName - Child model name
 * @template TRelationName - Relation field name on child model
 * @template TFields - Field definitions for each child item
 * @param config - Configuration object for the one-to-many relationship
 * @returns Field definition for use in `defineCreateOperation` or `defineUpdateOperation`
 *
 * @example
 * ```typescript
 * const fields = {
 *   images: nestedOneToManyField({
 *     parentModel: createParentModelConfig('user', (user) => ({ id: user.id })),
 *     model: 'userImage',
 *     relationName: 'user',
 *     fields: {
 *       id: scalarField(z.string()),
 *       caption: scalarField(z.string()),
 *     },
 *     getWhereUnique: (input) => input.id ? { id: input.id } : undefined,
 *     buildData: (data) => ({
 *       create: { caption: data.caption },
 *       update: { caption: data.caption },
 *     }),
 *   }),
 * };
 *
 * // Create user with images
 * await createUser({
 *   data: {
 *     name: 'John',
 *     images: [
 *       { caption: 'First image' },
 *       { caption: 'Second image' },
 *     ],
 *   },
 *   context: ctx,
 * });
 *
 * // Update user images (creates new, updates existing, deletes removed)
 * await updateUser({
 *   where: { id: userId },
 *   data: {
 *     images: [
 *       { id: 'img-1', caption: 'Updated caption' }, // Updates existing
 *       { caption: 'New image' }, // Creates new
 *       // img-2 not in array, will be deleted
 *     ],
 *   },
 *   context: ctx,
 * });
 * ```
 */
export function nestedOneToManyField<
  TParentModelName extends ModelPropName,
  TModelName extends ModelPropName,
  TRelationName extends RelationName<TModelName>,
  TFields extends Record<string, AnyFieldDefinition>,
>(
  config: NestedOneToManyFieldConfig<
    TParentModelName,
    TModelName,
    TRelationName,
    TFields
  >,
): FieldDefinition<
  z.ZodOptional<z.ZodArray<InferInputSchema<TFields>>>,
  undefined,
  undefined | { deleteMany: Record<never, never> }
> {
  const getWhereUnique = (
    input: InferInput<TFields>,
    originalModel: GetPayload<TParentModelName>,
  ): WhereUniqueInput<TModelName> | undefined => {
    const whereUnique = config.getWhereUnique(input, originalModel);
    if (whereUnique && Object.values(whereUnique).includes(undefined)) {
      throw new Error(
        'getWhereUnique cannot return any undefined values in the object',
      );
    }
    return whereUnique;
  };

  return {
    schema: generateCreateSchema(config.fields).array().optional(),
    processInput: async (value, processCtx) => {
      const { serviceContext, loadExisting } = processCtx;

      if (value === undefined) {
        return { data: { create: undefined, update: undefined } };
      }

      const existingModel = (await loadExisting()) as
        | GetPayload<TParentModelName>
        | undefined;

      // Filter objects that relate to parent model only
      const whereFromOriginalModel = existingModel && {
        [config.relationName]: expandWhereUnique(
          config.parentModel.getWhereUnique(existingModel),
        ),
      };
      // Handle list of items
      const delegate = makeGenericPrismaDelegate(prisma, config.model);

      const cachedLoadExisting = value.map((itemInput) => {
        let cachedExisting: GetPayload<TModelName> | undefined;
        const whereUnique =
          existingModel && getWhereUnique(itemInput, existingModel);

        return async (): Promise<GetPayload<TModelName> | undefined> => {
          if (cachedExisting) return cachedExisting;
          if (!whereUnique) return undefined;
          cachedExisting =
            ((await delegate.findUnique({
              where: { ...whereUnique, ...whereFromOriginalModel },
            })) as GetPayload<TModelName> | null) ?? undefined;
          return cachedExisting;
        };
      });

      const processedItems = await Promise.all(
        value.map(async (itemInput, idx) => {
          const whereUnique =
            existingModel && config.getWhereUnique(itemInput, existingModel);

          const { data, hooks } = await transformFields(
            config.fields,
            itemInput,
            {
              serviceContext,
              operation: 'upsert',
              allowOptionalFields: false,
              loadExisting: cachedLoadExisting[idx] as () => Promise<
                object | undefined
              >,
            },
          );

          return { whereUnique, data, hooks };
        }),
      );

      const beforeExecuteHook = async (
        ctx: TransactionalOperationContext<
          GetPayload<TParentModelName>,
          { hasResult: false }
        >,
      ): Promise<void> => {
        await Promise.all(
          processedItems.map((item, idx) =>
            invokeHooks(item.hooks.beforeExecute, {
              ...ctx,
              loadExisting: cachedLoadExisting[idx],
            }),
          ),
        );
      };

      const results: (GetPayload<TModelName> | undefined)[] = Array.from(
        { length: value.length },
        () => undefined,
      );
      const afterExecuteHook = async (
        ctx: TransactionalOperationContext<
          GetPayload<TParentModelName>,
          { hasResult: true }
        >,
      ): Promise<void> => {
        const prismaDelegate = makeGenericPrismaDelegate(ctx.tx, config.model);

        // Delete items not in the input
        if (whereFromOriginalModel) {
          const keepFilters = processedItems
            .map((item) => expandWhereUnique(item.whereUnique))
            .filter(
              (where): where is WhereInput<TModelName> => where !== undefined,
            )
            .map((where) => ({ NOT: where }));

          const deleteWhere =
            keepFilters.length === 0
              ? whereFromOriginalModel
              : ({
                  AND: [whereFromOriginalModel, ...keepFilters],
                } as WhereInput<TModelName>);

          await prismaDelegate.deleteMany({ where: deleteWhere });
        }

        // Upsert items
        await Promise.all(
          processedItems.map(async (item, idx) => {
            const awaitedData =
              typeof item.data === 'function'
                ? await item.data(ctx.tx)
                : item.data;

            const parentWhereUnique = config.parentModel.getWhereUnique(
              ctx.result,
            );

            const sharedCtx: TransactionalOperationContext<
              GetPayload<TModelName> | undefined,
              { hasResult: false }
            > = {
              ...ctx,
              operation: item.whereUnique ? 'update' : 'create',
              loadExisting: cachedLoadExisting[idx],
              result: undefined,
            };
            const [builtCreate, builtUpdate] = await Promise.all([
              config.buildCreateData(
                {
                  ...awaitedData.create,
                  ...({
                    [config.relationName]: { connect: parentWhereUnique },
                  } as Record<
                    TRelationName,
                    { connect: WhereUniqueInput<TParentModelName> }
                  >),
                },
                ctx.result,
                sharedCtx,
              ),
              config.buildUpdateData(awaitedData.update, ctx.result, sharedCtx),
            ]);

            results[idx] = item.whereUnique
              ? await prismaDelegate.upsert({
                  where: item.whereUnique,
                  create: builtCreate,
                  update: builtUpdate,
                })
              : await prismaDelegate.create({
                  data: builtCreate,
                });

            await invokeHooks(item.hooks.afterExecute, {
              ...ctx,
              result: results[idx],
              loadExisting: cachedLoadExisting[idx],
            });
          }),
        );
      };

      const afterCommitHook = async (
        ctx: OperationContext<
          GetPayload<TParentModelName>,
          { hasResult: true }
        >,
      ): Promise<void> => {
        await Promise.all(
          processedItems.map((item, idx) =>
            invokeHooks(item.hooks.afterCommit, {
              ...ctx,
              result: results[idx],
              loadExisting: cachedLoadExisting[idx],
            }),
          ),
        );
      };

      return {
        data: {},
        hooks: {
          beforeExecute: [beforeExecuteHook],
          afterExecute: [afterExecuteHook],
          afterCommit: [afterCommitHook],
        },
      };
    },
  };
}
