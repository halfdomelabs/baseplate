import { z } from 'zod';

import { modelEnumEntityType, modelEnumValueEntityType } from './types.js';
import { featureEntityType } from '../features/index.js';
import { zEnt, zRef } from '@src/references/index.js';

export const enumValueSchema = zEnt(
  z.object({
    name: z.string().min(1),
    friendlyName: z.string().min(1),
  }),
  {
    type: modelEnumValueEntityType,
    parentPath: { context: 'enum' },
    stripIdWhenSerializing: true,
  },
);

export type EnumValueConfig = z.infer<typeof enumSchema>;

export const enumSchema = zEnt(
  z.object({
    name: z.string().min(1),
    feature: zRef(z.string().min(1), {
      type: featureEntityType,
      onDelete: 'RESTRICT',
    }),
    values: z.array(enumValueSchema),
    isExposed: z.boolean(),
  }),
  {
    type: modelEnumEntityType,
    addContext: 'enum',
  },
);

export type EnumConfig = z.infer<typeof enumSchema>;
