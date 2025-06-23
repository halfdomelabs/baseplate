// @ts-nocheck

import type { def } from '#src/schema/creator/index.js';
import { definitionSchema } from '#src/schema/creator/schema-creator.js';
import { z } from 'zod';

export const createUserRoleSchema = definitionSchema(() =>
  z.enum(['admin', 'user']),
);

export const createUserSchema = definitionSchema((ctx) =>
  z.object({
    id: z.string(),
    name: z.string(),
    role: createUserRoleSchema(ctx),
  }),
);

export const createProjectSchema = definitionSchema((ctx) =>
  z.object({
    name: z.string(),
    owner: createUserSchema(ctx),
    collaborators: z.array(createUserSchema(ctx)),
  }),
);

export type UserRole = def.InferOutput<typeof createUserRoleSchema>;
export type UserConfig = def.InferOutput<typeof createUserSchema>;
export type UserConfigInput = def.InferInput<typeof createUserSchema>;
export type ProjectConfig = def.InferOutput<typeof createProjectSchema>;
export type ProjectConfigInput = def.InferInput<typeof createProjectSchema>;
