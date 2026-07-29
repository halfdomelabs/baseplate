import { z } from 'zod';

import type { def } from '#src/schema/creator/index.js';

import { withDefault } from '#src/schema/creator/index.js';
import {
  definitionSchema,
  definitionSchemaWithSlots,
} from '#src/schema/creator/schema-creator.js';
import { withByKeyMergeRule } from '#src/tools/merge-schema/merge-rule-registry.js';

import { authRoleEntityType } from '../auth/index.js';
import { modelAuthorizerRoleEntityType } from './authorizer/types.js';
import {
  modelEntityType,
  modelForeignRelationEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldEntityType,
} from './types.js';

const createRoleArray = definitionSchema((ctx) =>
  ctx.withDefault(
    z.array(
      ctx.withRef({
        type: authRoleEntityType,
        onDelete: 'DELETE',
      }),
    ),
    [],
  ),
);

export const createModelGraphqlSchema = definitionSchemaWithSlots(
  {
    modelSlot: modelEntityType,
  },
  (ctx, { modelSlot }) =>
    z.object({
      objectType: ctx.withDefault(
        z.object({
          enabled: ctx.withDefault(z.boolean(), false),
          fields: z
            .array(
              z.object({
                ref: ctx.withRef({
                  type: modelScalarFieldEntityType,
                  onDelete: 'DELETE_PARENT',
                  parentSlot: modelSlot,
                }),
                globalRoles: createRoleArray(ctx),
                instanceRoles: ctx.withDefault(
                  z.array(
                    ctx.withRef({
                      type: modelAuthorizerRoleEntityType,
                      onDelete: 'DELETE',
                      parentSlot: modelSlot,
                    }),
                  ),
                  [],
                ),
              }),
            )
            .apply(withByKeyMergeRule({ getKey: (item) => item.ref }))
            .apply(withDefault([])),
          localRelations: z
            .array(
              z.object({
                ref: ctx.withRef({
                  type: modelLocalRelationEntityType,
                  onDelete: 'DELETE_PARENT',
                  parentSlot: modelSlot,
                }),
                globalRoles: createRoleArray(ctx),
                instanceRoles: ctx.withDefault(
                  z.array(
                    ctx.withRef({
                      type: modelAuthorizerRoleEntityType,
                      onDelete: 'DELETE',
                      parentSlot: modelSlot,
                    }),
                  ),
                  [],
                ),
              }),
            )
            .apply(withByKeyMergeRule({ getKey: (item) => item.ref }))
            .apply(withDefault([])),
          foreignRelations: z
            .array(
              z.object({
                ref: ctx.withRef({
                  type: modelForeignRelationEntityType,
                  onDelete: 'DELETE_PARENT',
                  parentSlot: modelSlot,
                }),
                globalRoles: createRoleArray(ctx),
                instanceRoles: ctx.withDefault(
                  z.array(
                    ctx.withRef({
                      type: modelAuthorizerRoleEntityType,
                      onDelete: 'DELETE',
                      parentSlot: modelSlot,
                    }),
                  ),
                  [],
                ),
                paginated: ctx.withDefault(z.boolean(), false),
                orderable: ctx.withDefault(z.boolean(), false),
              }),
            )
            .apply(withByKeyMergeRule({ getKey: (item) => item.ref }))
            .apply(withDefault([])),
        }),
        {},
      ),
      /**
       * Sorting configuration shared by every surface that exposes an
       * `orderBy` argument — the list and connection queries, and `orderable`
       * list relations. Each surface opts in separately (`queries.orderBy.enabled`,
       * `objectType.foreignRelations[].orderable`) but they all sort by the
       * same fields.
       */
      orderBy: ctx.withDefault(
        z.object({
          /** Fields exposed as `orderBy` sort keys. */
          fields: z
            .array(
              ctx.withRef({
                type: modelScalarFieldEntityType,
                onDelete: 'DELETE_PARENT',
                parentSlot: modelSlot,
              }),
            )
            .apply(withDefault([])),
          /**
           * Applied when a caller supplies no `orderBy`. Ordered, so multi-key
           * defaults sort by the first entry first. Not restricted to
           * `fields` — a model can default to a sort key it does not expose.
           */
          defaultSort: z
            .array(
              z.object({
                ref: ctx.withRef({
                  type: modelScalarFieldEntityType,
                  onDelete: 'DELETE_PARENT',
                  parentSlot: modelSlot,
                }),
                direction: ctx.withDefault(z.enum(['asc', 'desc']), 'asc'),
              }),
            )
            .apply(withByKeyMergeRule({ getKey: (item) => item.ref }))
            .apply(withDefault([])),
        }),
        {},
      ),
      /**
       * Filtering configuration for surfaces that expose a `where` argument —
       * the list and connection queries (`queries.where.enabled`). Shaped like
       * `orderBy` so relation-level filtering can reuse it.
       */
      where: ctx.withDefault(
        z.object({
          /** Fields exposed as `where` filter operands. */
          fields: z
            .array(
              ctx.withRef({
                type: modelScalarFieldEntityType,
                onDelete: 'DELETE_PARENT',
                parentSlot: modelSlot,
              }),
            )
            .apply(withDefault([])),
        }),
        {},
      ),
      /**
       * Page-size limits shared by every paginated surface — the list query,
       * the connection query, and paginated list relations. Both are optional;
       * leaving them unset keeps the offset surfaces unbounded and lets the
       * connection fall back to Pothos' own defaults (20 / 100). Setting only a
       * max also applies it as the default, since the cap on an offset surface
       * would otherwise be bypassed by omitting the argument.
       */
      pagination: ctx.withDefault(
        z
          .object({
            /** Page size applied when the caller requests no explicit size. */
            defaultPageSize: z.number().int().positive().optional(),
            /** Largest page a caller may request. */
            maxPageSize: z.number().int().positive().optional(),
          })
          .refine(
            ({ defaultPageSize, maxPageSize }) =>
              defaultPageSize === undefined ||
              maxPageSize === undefined ||
              defaultPageSize <= maxPageSize,
            {
              message: 'Default page size cannot exceed max page size',
              path: ['defaultPageSize'],
            },
          ),
        {},
      ),
      queries: ctx.withDefault(
        z.object({
          globalRoles: createRoleArray(ctx),
          instanceRoles: ctx.withDefault(
            z.array(
              ctx.withRef({
                type: modelAuthorizerRoleEntityType,
                onDelete: 'DELETE',
                parentSlot: modelSlot,
              }),
            ),
            [],
          ),
          get: ctx.withDefault(
            z.object({
              enabled: ctx.withDefault(z.boolean(), false),
            }),
            {},
          ),
          /** Offset pagination (`skip`/`take`). */
          list: ctx.withDefault(
            z.object({
              enabled: ctx.withDefault(z.boolean(), false),
              count: ctx.withDefault(
                z.object({
                  enabled: ctx.withDefault(z.boolean(), false),
                }),
                {},
              ),
            }),
            {},
          ),
          /**
           * Cursor pagination (Relay connection). Independent of `list` — a
           * model may expose either, both, or neither.
           */
          connection: ctx.withDefault(
            z.object({
              enabled: ctx.withDefault(z.boolean(), false),
            }),
            {},
          ),
          /**
           * `where`/`orderBy` arguments, shared by the list and connection
           * queries. The fields each may operate on live in the model-level
           * `where.fields` / `orderBy.fields` lists.
           */
          where: ctx.withDefault(
            z.object({
              enabled: ctx.withDefault(z.boolean(), false),
            }),
            {},
          ),
          orderBy: ctx.withDefault(
            z.object({
              enabled: ctx.withDefault(z.boolean(), false),
            }),
            {},
          ),
        }),
        {},
      ),
      mutations: ctx.withDefault(
        z.object({
          create: ctx.withDefault(
            z.object({
              enabled: ctx.withDefault(z.boolean(), false),
            }),
            {},
          ),
          update: ctx.withDefault(
            z.object({
              enabled: ctx.withDefault(z.boolean(), false),
            }),
            {},
          ),
          delete: ctx.withDefault(
            z.object({
              enabled: ctx.withDefault(z.boolean(), false),
            }),
            {},
          ),
        }),
        {},
      ),
    }),
);

export type ModelGraphqlInput = def.InferInput<typeof createModelGraphqlSchema>;

export type ModelGraphqlDefinition = def.InferOutput<
  typeof createModelGraphqlSchema
>;
