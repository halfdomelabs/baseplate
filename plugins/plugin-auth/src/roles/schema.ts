import type { def } from '@baseplate-dev/project-builder-lib';

import {
  authRoleEntityType,
  definitionSchema,
} from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

import { AUTH_DEFAULT_ROLES } from './constants.js';

export const createAuthRoleSchema = definitionSchema((ctx) =>
  ctx.withEnt(
    z.object({
      id: z.string(),
      name: z.string().min(1),
      comment: z.string().min(1),
      builtIn: z.boolean().default(false),
    }),
    { type: authRoleEntityType },
  ),
);

/**
 * Defines the schema for a role.
 */
export type AuthRoleDefinition = def.InferOutput<typeof createAuthRoleSchema>;

export type AuthRoleInput = def.InferInput<typeof createAuthRoleSchema>;

/**
 * Defines the schema for an array of roles ensuring that there are no duplicate
 * role names and that the built-in roles are included.
 */
export const createAuthRolesSchema = definitionSchema((ctx) =>
  z
    .array(createAuthRoleSchema(ctx))
    .superRefine((roles, ctx) => {
      const dup = roles
        .map((r) => r.name)
        .filter((v, i, a) => a.indexOf(v) !== i);
      if (dup.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate role name(s): ${dup.join(', ')}`,
        });
      }
    })
    .transform((roles) => [
      ...AUTH_DEFAULT_ROLES.map((r) => {
        const existingRole = roles.find((role) => role.name === r.name);
        return existingRole
          ? {
              ...existingRole,
              builtIn: true,
            }
          : {
              ...r,
              builtIn: true,
              id: authRoleEntityType.generateNewId(),
            };
      }),
      // Filter out the built-in roles
      ...roles.filter(
        (r) => !AUTH_DEFAULT_ROLES.map((v) => v.name).includes(r.name),
      ),
    ]),
);
