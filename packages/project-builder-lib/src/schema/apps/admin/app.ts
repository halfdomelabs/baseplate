import { z } from 'zod';

import { zRef, zRefBuilder } from '#src/references/index.js';
import { authRoleEntityType } from '#src/schema/auth/index.js';

import type { AdminCrudSectionConfig } from './sections/index.js';

import { baseAppValidators } from '../base.js';
import { createAppEntryType } from '../types.js';
import { adminCrudSectionSchema } from './sections/crud.js';
import { adminSectionEntityType } from './sections/types.js';

export const adminSectionSchema = zRefBuilder(
  adminCrudSectionSchema,
  (builder) => {
    builder.addEntity({
      type: adminSectionEntityType,
      parentPath: { context: 'app' },
      addContext: 'admin-section',
    });
  },
);

export type AdminSectionConfig = AdminCrudSectionConfig;

export type AdminSectionConfigInput = z.input<typeof adminSectionSchema>;

export const adminAppSchema = z.object({
  ...baseAppValidators,
  type: z.literal('admin'),
  allowedRoles: z
    .array(
      zRef(z.string(), {
        type: authRoleEntityType,
        onDelete: 'DELETE',
      }),
    )
    .optional(),
  sections: z.array(adminSectionSchema).optional(),
});

export type AdminAppConfig = z.infer<typeof adminAppSchema>;

export const adminAppEntryType = createAppEntryType<AdminAppConfig>('admin');
