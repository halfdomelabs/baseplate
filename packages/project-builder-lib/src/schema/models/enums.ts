import { z } from 'zod';

import { modelEnumEntityType } from './types.js';
import { featureEntityType } from '../features/index.js';
import { zEnt, zRef } from '@src/references/index.js';
import { randomUid } from '@src/utils/randomUid.js';

export const enumValueSchema = z.object({
  uid: z.string().default(randomUid),
  name: z.string().min(1),
  friendlyName: z.string().min(1),
});

export type EnumValueConfig = z.infer<typeof enumSchema>;

export const enumSchema = zEnt(
  z.object({
    uid: z.string().default(randomUid),
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
  },
);

export type EnumConfig = z.infer<typeof enumSchema>;
