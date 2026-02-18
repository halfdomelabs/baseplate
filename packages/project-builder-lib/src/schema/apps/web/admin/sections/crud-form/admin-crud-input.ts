import z from 'zod';

import type { def } from '#src/schema/creator/index.js';

import { definitionSchemaWithSlots } from '#src/schema/creator/schema-creator.js';
import { modelEntityType } from '#src/schema/models/index.js';

import type { baseAdminCrudInputSchema } from './types.js';

import { adminSectionEntityType } from '../types.js';
import { adminCrudInputSpec } from './admin-input-spec.js';

export const createAdminCrudInputSchema = definitionSchemaWithSlots(
  { modelSlot: modelEntityType, adminSectionSlot: adminSectionEntityType },
  (ctx, slots) => {
    const { inputs } = ctx.plugins.use(adminCrudInputSpec);
    return z.discriminatedUnion(
      'type',
      [...inputs.values()].map((input) => input.createSchema(ctx, slots)) as [
        typeof baseAdminCrudInputSchema,
      ],
    );
  },
);

export type AdminCrudInputConfig = def.InferOutput<
  typeof createAdminCrudInputSchema
>;

export type AdminCrudInputConfigInput = def.InferInput<
  typeof createAdminCrudInputSchema
>;
