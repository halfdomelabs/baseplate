import { z } from 'zod';

import type { def } from '#src/schema/creator/index.js';

import {
  definitionSchema,
  definitionSchemaWithSlots,
} from '#src/schema/creator/schema-creator.js';
import { VALIDATORS } from '#src/schema/utils/validation.js';

import { featureEntityType } from '../features/index.js';
import { modelEnumEntityType, modelEnumValueEntityType } from './types.js';

export const createEnumValueSchema = definitionSchemaWithSlots(
  { enumSlot: modelEnumEntityType },
  (ctx, { enumSlot }) =>
    ctx.withEnt(
      z.object({
        id: z.string(),
        name: VALIDATORS.CONSTANT_CASE_STRING,
        friendlyName: z.string().min(1),
        description: z.string().default(''),
      }),
      {
        type: modelEnumValueEntityType,
        parentSlot: enumSlot,
      },
    ),
);

export type EnumValueConfig = def.InferOutput<typeof createEnumValueSchema>;

export const createEnumBaseSchema = definitionSchemaWithSlots(
  { enumSlot: modelEnumEntityType },
  (ctx, { enumSlot }) =>
    z.object({
      id: z.string(),
      name: VALIDATORS.PASCAL_CASE_STRING,
      featureRef: ctx.withRef({
        type: featureEntityType,
        onDelete: 'RESTRICT',
      }),
      values: z.array(createEnumValueSchema(ctx, { enumSlot })),
      isExposed: z.boolean(),
    }),
);

export const createEnumSchema = definitionSchema((ctx) =>
  ctx.refContext({ enumSlot: modelEnumEntityType }, ({ enumSlot }) =>
    ctx.withEnt(createEnumBaseSchema(ctx, { enumSlot }), {
      type: modelEnumEntityType,
      provides: enumSlot,
    }),
  ),
);

export type EnumConfig = def.InferOutput<typeof createEnumSchema>;

export type EnumConfigInput = def.InferInput<typeof createEnumSchema>;
