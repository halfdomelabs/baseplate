import { z } from 'zod';
import { ReferencesBuilder } from '@src/schema/references';
import { baseAppValidators } from '../base';
import { AdminCrudSectionConfig } from './sections';
import {
  adminCrudSectionSchema,
  buildAdminCrudSectionReferences,
} from './sections/crud';

export const adminSectionSchema = adminCrudSectionSchema;

export type AdminSectionConfig = AdminCrudSectionConfig;

export const adminAppSchema = z.object({
  ...baseAppValidators,
  type: z.literal('admin'),
  allowedRoles: z.array(z.string().min(1)),
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
