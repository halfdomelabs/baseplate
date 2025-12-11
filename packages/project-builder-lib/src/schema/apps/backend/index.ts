import { z } from 'zod';

import type { def } from '#src/schema/creator/index.js';

import { definitionSchemaWithSlots } from '#src/schema/creator/schema-creator.js';

import { baseAppValidators } from '../base.js';
import { appEntityType, createAppEntryType } from '../types.js';

export const createBackendAppSchema = definitionSchemaWithSlots(
  { appSlot: appEntityType },
  () =>
    z.object({
      ...baseAppValidators,
      type: z.literal('backend'),
      enableStripe: z.boolean().optional(),
      enableBullQueue: z.boolean().optional(),
      enablePostmark: z.boolean().optional(),
      enableSubscriptions: z.boolean().optional(),
      enableAxios: z.boolean().optional(),
    }),
);

export type BackendAppConfig = def.InferOutput<typeof createBackendAppSchema>;

export const backendAppEntryType =
  createAppEntryType<BackendAppConfig>('backend');
