import { z } from 'zod';

import { ReferencesBuilder } from '../references.js';
import { randomUid } from '@src/utils/randomUid.js';

export const enumValueSchema = z.object({
  uid: z.string().default(randomUid),
  name: z.string().min(1),
  friendlyName: z.string().min(1),
});

export type EnumValueConfig = z.infer<typeof enumSchema>;

export const enumSchema = z.object({
  uid: z.string().default(randomUid),
  name: z.string().min(1),
  feature: z.string().min(1),
  values: z.array(enumValueSchema),
  isExposed: z.boolean(),
});

export type EnumConfig = z.infer<typeof enumSchema>;

export function buildEnumReferences(
  enumConfig: EnumConfig,
  builder: ReferencesBuilder<EnumConfig>,
): void {
  builder.addReference('feature', { category: 'feature' });
  builder.addReferenceable({
    category: 'enum',
    id: enumConfig.uid,
    name: enumConfig.name,
  });
}
