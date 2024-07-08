import { z } from 'zod';

import { adminCrudSectionSchema } from './sections/crud.js';
import { AdminCrudSectionConfig } from './sections/index.js';
import { adminSectionEntityType } from './sections/types.js';
import { baseAppValidators } from '../base.js';
import { createAppEntryType } from '../types.js';
import { zRef, zRefBuilder } from '@src/references/index.js';
import { authRoleEntityType } from '@src/schema/auth/types.js';

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
