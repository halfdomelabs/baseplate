// @ts-nocheck

import type { def } from '#src/schema/creator/index.js';
import { definitionSchema } from '#src/schema/creator/schema-creator.js';
import { z } from 'zod';

export const createBaseSchema = definitionSchema(() =>
  z.object({
    name: z.string(),
  }),
);

export const createDependentSchema = definitionSchema((ctx) =>
  z.object({
    base: createBaseSchema(ctx),
    additional: z.string(),
  }),
);

export type BaseConfig = def.InferOutput<typeof createBaseSchema>;
export type DependentConfig = def.InferOutput<typeof createDependentSchema>;
