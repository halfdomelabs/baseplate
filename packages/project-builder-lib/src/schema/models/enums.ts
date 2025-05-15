import { z } from 'zod';

import { zEnt, zRef } from '@src/references/index.js';

import { featureEntityType } from '../features/index.js';
import { modelEnumEntityType, modelEnumValueEntityType } from './types.js';

export const enumValueSchema = zEnt(
  z.object({
    name: z.string().min(1),
    friendlyName: z.string().min(1),
  }),
  {
    type: modelEnumValueEntityType,
    parentPath: { context: 'enum' },
  },
);

export type EnumValueConfig = z.infer<typeof enumSchema>;

export const enumBaseSchema = z.object({
  name: z.string().min(1),
  featureRef: zRef(z.string().min(1), {
    type: featureEntityType,
    onDelete: 'RESTRICT',
  }),
  values: z.array(enumValueSchema),
  isExposed: z.boolean(),
});

export const enumSchema = zEnt(enumBaseSchema, {
  type: modelEnumEntityType,
  addContext: 'enum',
});

export type EnumConfig = z.infer<typeof enumSchema>;
