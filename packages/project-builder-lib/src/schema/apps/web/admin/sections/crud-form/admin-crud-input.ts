import { definitionSchemaWithSlots } from '#src/schema/creator/schema-creator.js';
import { modelEntityType } from '#src/schema/models/index.js';

import { adminSectionEntityType } from '../types.js';
import { adminCrudInputSpec } from './admin-input-spec.js';
import { baseAdminCrudInputSchema } from './types.js';

export const createAdminCrudInputSchema = definitionSchemaWithSlots(
  { modelSlot: modelEntityType, adminSectionSlot: adminSectionEntityType },
  (ctx, slots) => {
    const adminCrudInputs = ctx.plugins.use(adminCrudInputSpec).inputs;

    return baseAdminCrudInputSchema.transform((data) => {
      const inputDef = adminCrudInputs.get(data.type);
      if (!inputDef) return data;
      return inputDef.createSchema(ctx, slots).parse(data);
    });
  },
);
