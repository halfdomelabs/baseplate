import type { z } from 'zod';

import { prisma } from '@src/services/prisma.js';

import type {
  AnyFieldDefinition,
  FieldDefinition,
  InferFieldsCreateOutput,
  InferFieldsUpdateOutput,
  InferInput,
  OperationContext,
  TransactionalOperationContext,
} from './types.js';
import type {
  CreateInput,
  GetPayload,
  ModelPropName,
  UpdateInput,
  WhereInput,
  WhereUniqueInput,
} from './utility-types.js';

import { invokeHooks, transformFields } from './define-operations.js';
import { makeGenericPrismaDelegate } from './prisma-utils.js';

/**
 * Create a simple scalar field with validation only
 *
 * This helper creates a field definition that validates input using a Zod schema.
 * The validated value is passed through unchanged to the transform step.
 *
 * For relation fields (e.g., `userId`), use this helper to validate the ID,
 * then use relation helpers in the transform step to create Prisma connect/disconnect objects.
 *
 * @param schema - Zod schema for validation
 * @returns Field definition
 *
 * @example
 * ```typescript
 * const fields = {
 *   title: scalarField(z.string()),
 *   ownerId: scalarField(z.string()), // Validated as string
 * };
 *
 * // In transform, convert IDs to relations:
 * transform: (data) => ({
 *   title: data.title,
 *   owner: relation.required(data.ownerId),
 * })
 * ```
 */
export function scalarField<TSchema extends z.ZodSchema>(
  schema: TSchema,
): FieldDefinition<z.input<TSchema>, z.output<TSchema>, z.output<TSchema>> {
  return {
    processInput: (value) => {
      const validated = schema.parse(value) as z.output<TSchema>;
      return {
        data: { create: validated, update: validated },
      };
    },
  };
}

/**
 * =========================================
 * Nested Field Handlers
 * =========================================
 */

interface PrismaFieldData<TModelName extends ModelPropName> {
  create: CreateInput<TModelName>;
  update: UpdateInput<TModelName>;
}

/**
 * Configuration for nested one-to-one field handler
 */
export interface NestedOneToOneFieldConfig<
  TParentModelName extends ModelPropName,
  TModelName extends ModelPropName,
  TFields extends Record<string, AnyFieldDefinition>,
> {
  /**
   * Prisma model name of parent model
   */
  parentModel: TParentModelName;

  /**
   * Prisma model name of the child model
   */
  model: TModelName;

  /**
   * Field definitions for the nested entity
   */
  fields: TFields;

  /**
   * Extract where unique from parent model
   */
  getWhereUniqueFromParent: (
    parentModel: GetPayload<TParentModelName>,
  ) => WhereUniqueInput<TModelName>;

  /**
   * Transform validated field data into final Prisma structure
   */
  buildData: (
    data: {
      create: InferFieldsCreateOutput<TFields>;
      update: InferFieldsUpdateOutput<TFields>;
    },
    parentModel: GetPayload<TParentModelName>,
    ctx: TransactionalOperationContext<
      GetPayload<TModelName>,
      { hasResult: false }
    >,
  ) => PrismaFieldData<TModelName> | Promise<PrismaFieldData<TModelName>>;
}

/**
 * Create a nested one-to-one relationship field handler
 *
 * This helper creates a field definition for managing one-to-one nested relationships.
 * It handles nested field validation, transformation, and supports both create and update operations.
 *
 * For create operations:
 * - Returns nested create data if input is provided
 * - Returns undefined if input is not provided
 *
 * For update operations:
 * - Returns upsert if input has a unique identifier (via getWhereUnique)
 * - Returns create if input doesn't have a unique identifier
 * - Deletes the relation if input is null (requires deleteRelation)
 * - Returns undefined if input is not provided (no change)
 *
 * @param config - Configuration object
 * @returns Field definition
 *
 * @example
 * ```typescript
 * const fields = {
 *   userProfile: nestedOneToOneField({
 *     fields: {
 *       bio: scalarField(z.string()),
 *       avatar: fileField(avatarFileCategory),
 *     },
 *     buildData: (data) => ({
 *       bio: data.bio,
 *       avatar: data.avatar ? { connect: { id: data.avatar } } : undefined,
 *     }),
 *     getWhereUnique: (input) => input.id ? { id: input.id } : undefined,
 *     deleteRelation: async () => {
 *       await prisma.userProfile.deleteMany({ where: { userId: parentId } });
 *     },
 *   }),
 * };
 * ```
 */
export function nestedOneToOneField<
  TParentModelName extends ModelPropName,
  TModelName extends ModelPropName,
  TFields extends Record<string, AnyFieldDefinition>,
>(
  config: NestedOneToOneFieldConfig<TParentModelName, TModelName, TFields>,
): FieldDefinition<
  InferInput<TFields> | null | undefined,
  undefined,
  undefined | { delete: true }
> {
  return {
    processInput: async (value, processCtx) => {
      // Handle null - delete the relation
      if (value === null) {
        return {
          data: {
            create: undefined,
            update: { delete: true },
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
        const whereUnique = config.getWhereUniqueFromParent(
          existingParent as GetPayload<TParentModelName>,
        );
        const prismaDelegate = makeGenericPrismaDelegate(prisma, config.model);
        cachedExisting =
          (await prismaDelegate.findUnique({
            where: whereUnique,
          })) ?? undefined;
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
              const whereUnique = config.getWhereUniqueFromParent(
                ctx.result as GetPayload<TParentModelName>,
              );
              const builtData = await config.buildData(
                awaitedData,
                ctx.result as GetPayload<TParentModelName>,
                {
                  ...ctx,
                  operation: 'upsert',
                  loadExisting,
                },
              );
              const prismaDelegate = makeGenericPrismaDelegate(
                ctx.tx,
                config.model,
              );

              newModelResult = await prismaDelegate.upsert({
                where: whereUnique,
                create: builtData.create,
                update: builtData.update,
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
 * Configuration for nested one-to-many field handler
 */
export interface NestedOneToManyFieldConfig<
  TParentModelName extends ModelPropName,
  TModelName extends ModelPropName,
  TFields extends Record<string, AnyFieldDefinition>,
> {
  /**
   * Prisma model name of parent model
   */
  parentModel: TParentModelName;

  /**
   * Prisma model name of the child model
   */
  model: TModelName;

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
   * Function to extract a where clause from the parent model.
   * @param parentModel - The parent model to get the where clause from.
   * @returns The where clause to use for the parent model.
   */
  getWhereFromParentModel: (
    parentModel: GetPayload<TParentModelName>,
  ) => WhereInput<TModelName>;

  /**
   * Transform validated field data into final Prisma structure for a single item.
   * The returned payload should not include the parent relation field, as it will be added automatically.
   */
  buildData: (
    data: {
      create: InferFieldsCreateOutput<TFields>;
      update: InferFieldsUpdateOutput<TFields>;
    },
    parentModel: GetPayload<TParentModelName>,
    ctx: TransactionalOperationContext<
      GetPayload<TModelName> | undefined,
      { hasResult: false }
    >,
  ) =>
    | Promise<{
        create: CreateInput<TModelName>;
        update: UpdateInput<TModelName>;
      }>
    | {
        create: CreateInput<TModelName>;
        update: UpdateInput<TModelName>;
      };
}

/**
 * Convert a Prisma `WhereUniqueInput` (with scalar or compound keys) into a plain `WhereInput`.
 *
 * Compound uniques arrive as synthetic keys (e.g. `userId_role: { userId, role }`), while the
 * generic `where` filter needs the flattened field structure. Normalizing lets us compose the
 * unique constraint with parent-level filters when constructing delete conditions.
 *
 * @param whereUnique Unique filter returned by `getWhereUnique`, or undefined when the item is new.
 * @returns A normalized where filter or undefined if no usable fields exist.
 */
function expandWhereUnique<TModelName extends ModelPropName>(
  whereUnique: WhereUniqueInput<TModelName> | undefined,
): WhereInput<TModelName> | undefined {
  if (!whereUnique) return undefined;

  const entries = Object.entries(whereUnique).filter(
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
 * Create a nested one-to-many relationship field handler
 *
 * This helper creates a field definition for managing one-to-many nested relationships.
 * It synchronizes a list of child entities based on the input array.
 *
 * - **Updating**: If an item in the input array has a unique identifier (from `getWhereUnique`), it's updated.
 * - **Creating**: If an item lacks a unique identifier, it's created.
 * - **Deleting**: Any existing child items not present in the input array are deleted.
 * - **Delete All**: Passing `null` as input will delete all associated child items.
 * - **No Change**: Passing `undefined` leaves the collection unchanged.
 *
 * All database operations are performed atomically within the parent operation's transaction.
 *
 * @param config - Configuration object for the one-to-many relationship.
 * @returns A field definition that can be used in `defineCreateOperation` or `defineUpdateOperation`.
 */
export function nestedOneToManyField<
  TParentModelName extends ModelPropName,
  TModelName extends ModelPropName,
  TFields extends Record<string, AnyFieldDefinition>,
>(
  config: NestedOneToManyFieldConfig<TParentModelName, TModelName, TFields>,
): FieldDefinition<
  InferInput<TFields>[] | undefined,
  undefined,
  undefined | { deleteMany: Record<never, never> }
> {
  return {
    processInput: async (value, processCtx) => {
      const { serviceContext, loadExisting } = processCtx;

      if (value === undefined) {
        return { data: { create: undefined, update: undefined } };
      }

      const existingModel = (await loadExisting()) as
        | GetPayload<TParentModelName>
        | undefined;
      const whereFromOriginalModel =
        existingModel && config.getWhereFromParentModel(existingModel);

      // Handle list of items
      const delegate = makeGenericPrismaDelegate(prisma, config.model);

      const cachedLoadExisting = value.map((itemInput) => {
        let cachedExisting: GetPayload<TModelName> | undefined;
        const whereUnique =
          existingModel && config.getWhereUnique(itemInput, existingModel);
        return async (): Promise<GetPayload<TModelName> | undefined> => {
          if (cachedExisting) return cachedExisting;
          if (!whereUnique) return undefined;
          cachedExisting =
            (await delegate.findUnique({
              where: { ...whereUnique, ...whereFromOriginalModel },
            })) ?? undefined;
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

            const builtData = await config.buildData(awaitedData, ctx.result, {
              ...ctx,
              operation: item.whereUnique ? 'update' : 'create',
              loadExisting: cachedLoadExisting[idx],
              result: undefined,
            });

            results[idx] = item.whereUnique
              ? await prismaDelegate.update({
                  where: item.whereUnique,
                  data: builtData.update,
                })
              : await prismaDelegate.create({
                  data: builtData.create,
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
