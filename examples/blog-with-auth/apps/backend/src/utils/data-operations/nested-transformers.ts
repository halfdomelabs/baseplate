import type { z } from 'zod';

import type { Prisma } from '@src/generated/prisma/client.js';

import type { ServiceContext } from '../service-context.js';
import type { GetResult, ModelPropName } from './prisma-types.js';
import type {
  BoundTransformer,
  MaybePromise,
  Transformer,
  TransformerResult,
} from './transformer-types.js';

/**
 * =========================================
 * Shared Types
 * =========================================
 */

/** Context passed to nested processCreate / processUpdate callbacks */
interface NestedProcessContext {
  serviceContext: ServiceContext;
}

/**
 * A deferred operation returned by processCreate / processUpdate.
 * Called inside the transaction after the parent record is created/updated.
 *
 * @template TParentResult - The type of the parent record
 */
type DeferredOperation<TParentResult> = (
  tx: Prisma.TransactionClient,
  parent: TParentResult,
) => Promise<void>;

/**
 * =========================================
 * One-to-One Transformer
 * =========================================
 */

/**
 * Configuration for a one-to-one nested transformer.
 * Types are inferred from `parentModel`, `model`, and `schema`.
 *
 * @template TParentModelName - Prisma parent model name (for typing parent in deferred ops)
 * @template TModelName - Prisma child model name (for typing existing)
 * @template TInputSchema - Zod schema (for typing input)
 */
export interface OneToOneTransformerConfig<
  TParentModelName extends ModelPropName,
  TModelName extends ModelPropName,
  TInputSchema extends z.ZodType,
> {
  /** Prisma parent model name — used for type inference only */
  parentModel: TParentModelName;
  /** Prisma child model name — used for type inference only */
  model: TModelName;
  /** Zod schema for the nested entity input — used for type inference only */
  schema: TInputSchema;

  /** Process a create operation. Returns a deferred operation for the transaction. */
  processCreate: (
    input: z.output<TInputSchema>,
    ctx: NestedProcessContext,
  ) => MaybePromise<DeferredOperation<GetResult<TParentModelName>>>;

  /**
   * Process an update operation. Only called when existing child is defined.
   * If no existing child, `processCreate` is called instead.
   * If omitted, updates are a no-op.
   */
  processUpdate?: (
    input: z.output<TInputSchema>,
    existing: GetResult<TModelName>,
    ctx: NestedProcessContext,
  ) => MaybePromise<DeferredOperation<GetResult<TParentModelName>>>;

  /** Delete the nested entity. Called when input is `null` on update and existing is defined. */
  processDelete: (
    existing: GetResult<TModelName>,
    ctx: NestedProcessContext,
  ) => DeferredOperation<GetResult<TParentModelName>>;
}

/**
 * Create a one-to-one nested transformer.
 *
 * Types are inferred from config — no manual generics needed:
 * - `parent` in deferred ops is typed from `parentModel`
 * - `existing` in processUpdate is typed from `model`
 * - `input` in processCreate/processUpdate is typed from `schema`
 *
 * @example
 * ```typescript
 * const profileTransformer = oneToOneTransformer({
 *   parentModel: 'user',
 *   model: 'userProfile',
 *   schema: profileInputSchema,
 *   processCreate: (input, ctx) => async (tx, parent) => {
 *     // parent is typed as GetResult<'user'>
 *     // input is typed from profileInputSchema
 *     await tx.userProfile.create({ data: { ...input, userId: parent.id } });
 *   },
 *   processUpdate: (input, existing, ctx) => async (tx, parent) => { ... },
 *   processDelete: (existing) => async (tx, parent) => { ... },
 * });
 * ```
 */
export function oneToOneTransformer<
  TParentModelName extends ModelPropName,
  TModelName extends ModelPropName,
  TInputSchema extends z.ZodType,
>(
  config: OneToOneTransformerConfig<TParentModelName, TModelName, TInputSchema>,
): Transformer<
  z.output<TInputSchema> | null | undefined,
  [],
  [
    context: {
      loadExisting: () => Promise<GetResult<TModelName> | null>;
    },
  ],
  undefined,
  undefined
> {
  return {
    forCreate(
      input: z.output<TInputSchema> | null | undefined,
    ): BoundTransformer<undefined> {
      return {
        async process(ctx): Promise<TransformerResult<undefined>> {
          if (input === null || input === undefined) return {};

          const deferredOp = await config.processCreate(input, ctx);
          return {
            afterExecute: [
              async ({ tx, result }) => {
                await deferredOp(tx, result as GetResult<TParentModelName>);
              },
            ],
          };
        },
      };
    },

    forUpdate(
      input: z.output<TInputSchema> | null | undefined,
      context: {
        loadExisting: () => Promise<GetResult<TModelName> | null>;
      },
    ): BoundTransformer<undefined> {
      return {
        async process(ctx): Promise<TransformerResult<undefined>> {
          if (input === undefined) return {};

          const existing = (await context.loadExisting()) ?? undefined;

          if (input === null) {
            if (!existing) return {};
            const deferredOp = config.processDelete(existing, ctx);
            return {
              afterExecute: [
                async ({ tx, result }) => {
                  await deferredOp(tx, result as GetResult<TParentModelName>);
                },
              ],
            };
          }

          const deferredOp =
            existing && config.processUpdate
              ? await config.processUpdate(input, existing, ctx)
              : await config.processCreate(input, ctx);
          return {
            afterExecute: [
              async ({ tx, result }) => {
                await deferredOp(tx, result as GetResult<TParentModelName>);
              },
            ],
          };
        },
      };
    },
  };
}

/**
 * =========================================
 * One-to-Many Transformer
 * =========================================
 */

/**
 * Configuration for a one-to-many nested transformer.
 * Types are inferred from `parentModel`, `model`, and `schema`.
 *
 * @template TParentModelName - Prisma parent model name
 * @template TModelName - Prisma child model name
 * @template TInputSchema - Zod schema for each item
 */
export interface OneToManyTransformerConfig<
  TParentModelName extends ModelPropName,
  TModelName extends ModelPropName,
  TInputSchema extends z.ZodType,
> {
  /** Prisma parent model name — used for type inference only */
  parentModel: TParentModelName;
  /** Prisma child model name — used for type inference only */
  model: TModelName;
  /** Zod schema for each item's input — used for type inference only */
  schema: TInputSchema;

  /**
   * Compare an input item to an existing item. Return true if they represent
   * the same entity (e.g., matching IDs). If omitted, all items are treated
   * as creates and all existing items are deleted (delete + recreate pattern).
   */
  compareItem?: (
    input: z.output<TInputSchema>,
    existing: GetResult<TModelName>,
  ) => boolean;

  /** Process a create operation for a single item. */
  processCreate: (
    itemInput: z.output<TInputSchema>,
    ctx: NestedProcessContext,
  ) => MaybePromise<DeferredOperation<GetResult<TParentModelName>>>;

  /**
   * Process an update operation for a single item.
   * Only called when `compareItem` finds a match.
   * If omitted, matched items fall through to `processCreate`.
   */
  processUpdate?: (
    itemInput: z.output<TInputSchema>,
    existingItem: GetResult<TModelName>,
    ctx: NestedProcessContext,
  ) => MaybePromise<DeferredOperation<GetResult<TParentModelName>>>;

  /** Delete removed items not present in the input array. Called inside the transaction after the main operation. */
  deleteRemoved: (
    tx: Prisma.TransactionClient,
    removedItems: GetResult<TModelName>[],
    parent: GetResult<TParentModelName>,
  ) => Promise<void>;
}

/**
 * Create a one-to-many nested transformer.
 *
 * Types are inferred from config — no manual generics needed.
 * Diff/match logic is provided by the caller via `loadExisting` in `.forUpdate()`.
 *
 * @example
 * ```typescript
 * const imagesTransformer = oneToManyTransformer({
 *   parentModel: 'user',
 *   model: 'userImage',
 *   schema: imageInputSchema,
 *   processCreate: (item, ctx) => async (tx, parent) => { ... },
 *   processUpdate: (item, existing, ctx) => async (tx, parent) => { ... },
 *   deleteRemoved: async (tx, removed, parent) => { ... },
 * });
 * ```
 */
export function oneToManyTransformer<
  TParentModelName extends ModelPropName,
  TModelName extends ModelPropName,
  TInputSchema extends z.ZodType,
>(
  config: OneToManyTransformerConfig<
    TParentModelName,
    TModelName,
    TInputSchema
  >,
): Transformer<
  z.output<TInputSchema>[] | undefined,
  [],
  [
    context: {
      loadExisting: () => Promise<GetResult<TModelName>[]>;
    },
  ],
  undefined,
  undefined
> {
  return {
    forCreate(
      items: z.output<TInputSchema>[] | undefined,
    ): BoundTransformer<undefined> {
      return {
        async process(ctx): Promise<TransformerResult<undefined>> {
          if (!items || items.length === 0) return {};

          const deferredOps = await Promise.all(
            items.map(async (item) => config.processCreate(item, ctx)),
          );

          return {
            afterExecute: [
              async ({ tx, result }) => {
                for (const op of deferredOps) {
                  await op(tx, result as GetResult<TParentModelName>);
                }
              },
            ],
          };
        },
      };
    },

    forUpdate(
      items: z.output<TInputSchema>[] | undefined,
      context: {
        loadExisting: () => Promise<GetResult<TModelName>[]>;
      },
    ): BoundTransformer<undefined> {
      return {
        async process(ctx): Promise<TransformerResult<undefined>> {
          if (items === undefined) return {};

          const existing = await context.loadExisting();

          const { compareItem } = config;
          const matched = items.map((item) => ({
            item,
            existingItem: compareItem
              ? existing.find((e) => compareItem(item, e))
              : undefined,
          }));

          const matchedExisting = new Set(
            matched.map((m) => m.existingItem).filter(Boolean),
          );
          const removedItems = existing.filter((e) => !matchedExisting.has(e));

          const deferredOps = await Promise.all(
            matched.map(async ({ item, existingItem }) =>
              existingItem && config.processUpdate
                ? config.processUpdate(item, existingItem, ctx)
                : config.processCreate(item, ctx),
            ),
          );

          return {
            afterExecute: [
              async ({ tx, result }) => {
                await config.deleteRemoved(
                  tx,
                  removedItems,
                  result as GetResult<TParentModelName>,
                );
                for (const op of deferredOps) {
                  await op(tx, result as GetResult<TParentModelName>);
                }
              },
            ],
          };
        },
      };
    },
  };
}
