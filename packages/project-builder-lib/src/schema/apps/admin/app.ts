import { z } from 'zod';

import type { def } from '#src/schema/creator/index.js';

import { authRoleEntityType } from '#src/schema/auth/index.js';
import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import type { AdminCrudSectionConfig } from './sections/index.js';

import { baseAppValidators } from '../base.js';
import { createAppEntryType } from '../types.js';
import { createAdminCrudSectionSchema } from './sections/crud.js';
import { adminSectionEntityType } from './sections/types.js';

export const createAdminSectionSchema = definitionSchema((ctx) =>
  ctx.withRefBuilder(createAdminCrudSectionSchema(ctx), (builder) => {
    builder.addEntity({
      type: adminSectionEntityType,
      parentPath: { context: 'app' },
      addContext: 'admin-section',
    });
  }),
);

export type AdminSectionConfig = AdminCrudSectionConfig;

export type AdminSectionConfigInput = def.InferInput<
  typeof createAdminSectionSchema
>;

export const createAdminAppSchema = definitionSchema((ctx) =>
  z.object({
    ...baseAppValidators,
    type: z.literal('admin'),
    allowedRoles: z
      .array(
        ctx.withRef({
          type: authRoleEntityType,
          onDelete: 'DELETE',
        }),
      )
      .optional(),
    sections: z.array(createAdminSectionSchema(ctx)).optional(),
  }),
);

export type AdminAppConfig = def.InferOutput<typeof createAdminAppSchema>;

export const adminAppEntryType = createAppEntryType<AdminAppConfig>('admin');
