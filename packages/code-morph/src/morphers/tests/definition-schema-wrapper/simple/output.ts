// @ts-nocheck

import type { def } from '#src/schema/creator/index.js';
import { definitionSchema } from '#src/schema/creator/schema-creator.js';
import { z } from 'zod';

export const createEnumValueSchema = definitionSchema(() =>
  z.object({
    name: z.string().min(1),
    friendlyName: z.string().min(1),
  }),
);

export type EnumValueConfig = def.InferOutput<typeof createEnumValueSchema>;

export const createEnumSchema = definitionSchema((ctx) =>
  z.object({
    name: z.string().min(1),
    values: z.array(createEnumValueSchema(ctx)),
    isExposed: z.boolean(),
  }),
);

export type EnumConfig = def.InferOutput<typeof createEnumSchema>;

export type EnumConfigInput = def.InferInput<typeof createEnumSchema>;
