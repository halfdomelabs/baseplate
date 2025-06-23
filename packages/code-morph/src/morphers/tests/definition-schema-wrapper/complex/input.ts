// @ts-nocheck

import { z } from 'zod';

export const userRoleSchema = z.enum(['admin', 'user']);

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: userRoleSchema,
});

export const projectSchema = z.object({
  name: z.string(),
  owner: userSchema,
  collaborators: z.array(userSchema),
});

export type UserRole = z.infer<typeof userRoleSchema>;
export type UserConfig = z.infer<typeof userSchema>;
export type UserConfigInput = z.input<typeof userSchema>;
export type ProjectConfig = z.infer<typeof projectSchema>;
export type ProjectConfigInput = z.input<typeof projectSchema>;
