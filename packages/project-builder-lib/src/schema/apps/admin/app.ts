import { z } from 'zod';
import { ReferencesBuilder } from '@src/schema/references.js';
import { baseAppValidators } from '../base.js';
import {
  adminCrudSectionSchema,
  buildAdminCrudSectionReferences,
} from './sections/crud.js';
import { AdminCrudSectionConfig } from './sections/index.js';

export const adminSectionSchema = adminCrudSectionSchema;

export type AdminSectionConfig = AdminCrudSectionConfig;

export const adminAppSchema = z.object({
  ...baseAppValidators,
  type: z.literal('admin'),
  allowedRoles: z.array(z.string().min(1)).optional(),
  sections: z.array(adminSectionSchema).optional(),
});

export type AdminAppConfig = z.infer<typeof adminAppSchema>;

export function buildAdminAppReferences(
  config: AdminAppConfig,
  builder: ReferencesBuilder<AdminAppConfig>
): void {
  builder.addReferences('allowedRoles.*', {
    category: 'role',
  });

  builder.addReferences('sections.*.feature', {
    category: 'feature',
  });

  config.sections?.forEach((page, index) => {
    switch (page.type) {
      case 'crud':
        buildAdminCrudSectionReferences(
          page,
          builder.withPrefix(`sections.${index}`)
        );
        break;
      default:
        throw new Error(`Unknown page type: ${page.type as string}`);
    }
  });
}
