import { z } from 'zod';

import {
  adminCrudSectionSchema,
  buildAdminCrudSectionReferences,
} from './sections/crud.js';
import { AdminCrudSectionConfig } from './sections/index.js';
import { baseAppValidators } from '../base.js';
import { zRef } from '@src/references/index.js';
import { authRoleEntityType } from '@src/schema/auth/types.js';
import { ReferencesBuilder } from '@src/schema/references.js';

export const adminSectionSchema = adminCrudSectionSchema;

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

export function buildAdminAppReferences(
  config: AdminAppConfig,
  builder: ReferencesBuilder<AdminAppConfig>,
): void {
  config.sections?.forEach((page, index) => {
    switch (page.type) {
      case 'crud':
        buildAdminCrudSectionReferences(
          page,
          builder.withPrefix(`sections.${index}`),
        );
        break;
      default:
        throw new Error(`Unknown page type: ${page.type as string}`);
    }
  });
}
