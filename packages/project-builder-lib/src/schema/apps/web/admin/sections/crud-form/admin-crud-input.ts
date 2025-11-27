import z from 'zod';

import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import type { baseAdminCrudInputSchema } from './types.js';

import { adminCrudInputSpec } from './admin-input-spec.js';

export const createAdminCrudInputSchema = definitionSchema((ctx) => {
  const adminCrudInputs = ctx.plugins
    .getPluginSpec(adminCrudInputSpec)
    .getAdminCrudInputs();
  const schemas = [...adminCrudInputs.values()].map((input) =>
    input.createSchema(ctx),
  );
  return z.discriminatedUnion(
    'type',
    schemas as [
      typeof baseAdminCrudInputSchema,
      ...(typeof baseAdminCrudInputSchema)[],
    ],
  );
});
