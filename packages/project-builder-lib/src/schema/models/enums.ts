import { z } from 'zod';

import type { def } from '#src/schema/creator/index.js';

import { zEnt, zRef } from '#src/references/index.js';
import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import { featureEntityType } from '../features/index.js';
import { modelEnumEntityType, modelEnumValueEntityType } from './types.js';

export const createEnumValueSchema = definitionSchema(() =>
  zEnt(
    z.object({
      name: z.string().min(1),
      friendlyName: z.string().min(1),
    }),
    {
      type: modelEnumValueEntityType,
      parentPath: { context: 'enum' },
    },
  ),
);

export type EnumValueConfig = def.InferOutput<typeof createEnumSchema>;

export const createEnumBaseSchema = definitionSchema((ctx) =>
  z.object({
    name: z.string().min(1),
    featureRef: zRef(z.string().min(1), {
      type: featureEntityType,
      onDelete: 'RESTRICT',
    }),
    values: z.array(createEnumValueSchema(ctx)),
    isExposed: z.boolean(),
  }),
);

export const createEnumSchema = definitionSchema((ctx) =>
  zEnt(createEnumBaseSchema(ctx), {
    type: modelEnumEntityType,
    addContext: 'enum',
  }),
);

export type EnumConfig = def.InferOutput<typeof createEnumSchema>;

export type EnumConfigInput = def.InferInput<typeof createEnumSchema>;
