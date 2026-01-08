import type { def } from '#src/schema/creator/index.js';

import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import { adminCrudActionSpec } from './admin-action-spec.js';
import { baseAdminCrudActionSchema } from './types.js';

export const createAdminCrudActionSchema = definitionSchema((ctx) => {
  const adminCrudActions = ctx.plugins.use(adminCrudActionSpec).actions;

  return baseAdminCrudActionSchema.transform((data) => {
    const actionDef = adminCrudActions.get(data.type);
    if (!actionDef) return data;
    return actionDef.createSchema(ctx).parse(data);
  });
});

export type AdminCrudActionConfig = def.InferOutput<
  typeof createAdminCrudActionSchema
>;

export type AdminCrudActionConfigInput = def.InferInput<
  typeof createAdminCrudActionSchema
>;
