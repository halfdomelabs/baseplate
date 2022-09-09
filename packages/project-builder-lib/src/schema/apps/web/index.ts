import { z } from 'zod';
import { ReferencesBuilder } from '@src/schema/references';
import { baseAppValidators } from '../base';

export const webAppSchema = z.object({
  ...baseAppValidators,
  type: z.literal('web'),
  includeAuth: z.boolean().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  allowedRoles: z.array(z.string().min(1)).optional(),
  includeUploadComponents: z.boolean().optional(),
  enableSubscriptions: z.boolean().optional(),
});

export type WebAppConfig = z.infer<typeof webAppSchema>;

export function buildWebAppReferences(
  config: WebAppConfig,
  builder: ReferencesBuilder<WebAppConfig>
): void {
  builder.addReferences('allowedRoles.*', {
    category: 'role',
  });
}
