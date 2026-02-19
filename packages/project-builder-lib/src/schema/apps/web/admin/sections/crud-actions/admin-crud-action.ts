import z from 'zod';

import type { def } from '#src/schema/creator/index.js';

import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import type { baseAdminCrudActionSchema } from './types.js';

import { adminCrudActionSpec } from './admin-action-spec.js';

export const createAdminCrudActionSchema = definitionSchema((ctx) => {
  const { actions } = ctx.plugins.use(adminCrudActionSpec);
  return z.discriminatedUnion(
    'type',
    [...actions.values()].map((action) => action.createSchema(ctx)) as [
      typeof baseAdminCrudActionSchema,
    ],
  );
});

export type AdminCrudActionConfig = def.InferOutput<
  typeof createAdminCrudActionSchema
>;

export type AdminCrudActionConfigInput = def.InferInput<
  typeof createAdminCrudActionSchema
>;
