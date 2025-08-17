import { z } from 'zod';

import type { def } from '#src/schema/creator/index.js';

import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import type { AdminCrudActionType } from './types.js';

import {
  baseAdminCrudActionSchema,
  createAdminCrudActionType,
} from './types.js';

export const createAdminCrudEditActionSchema = definitionSchema(() =>
  baseAdminCrudActionSchema.extend({
    type: z.literal('edit'),
  }),
);

export type AdminCrudEditActionConfig = def.InferInput<
  typeof createAdminCrudEditActionSchema
>;

const adminCrudEditActionType = createAdminCrudActionType({
  name: 'edit',
  createSchema: createAdminCrudEditActionSchema,
});

export const createAdminCrudDeleteActionSchema = definitionSchema(() =>
  baseAdminCrudActionSchema.extend({
    type: z.literal('delete'),
  }),
);

export type AdminCrudDeleteActionConfig = def.InferInput<
  typeof createAdminCrudDeleteActionSchema
>;

const adminCrudDeleteActionType = createAdminCrudActionType({
  name: 'delete',
  createSchema: createAdminCrudDeleteActionSchema,
});

export const BUILT_IN_ADMIN_CRUD_ACTIONS: AdminCrudActionType[] = [
  adminCrudEditActionType,
  adminCrudDeleteActionType,
];
