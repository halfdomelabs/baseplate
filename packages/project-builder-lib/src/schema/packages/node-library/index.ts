import { z } from 'zod';

import type { def } from '#src/schema/creator/index.js';

import { definitionSchemaWithSlots } from '#src/schema/creator/schema-creator.js';

import { basePackageValidators } from '../base.js';
import { createPackageEntryType, packageEntityType } from '../types.js';

export const createNodeLibraryPackageSchema = definitionSchemaWithSlots(
  { packageSlot: packageEntityType },
  () =>
    z.object({
      ...basePackageValidators,
      type: z.literal('node-library'),
    }),
);

export type NodeLibraryPackageConfig = def.InferOutput<
  typeof createNodeLibraryPackageSchema
>;

export const nodeLibraryPackageEntryType =
  createPackageEntryType<NodeLibraryPackageConfig>('node-library');
