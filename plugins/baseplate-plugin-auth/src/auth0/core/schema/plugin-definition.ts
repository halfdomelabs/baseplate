import {
  authRoleEntityType,
  featureEntityType,
  modelEntityType,
  zEnt,
  zRef,
} from '@halfdomelabs/project-builder-lib';
import { z } from 'zod';

const auth0RoleSchema = zEnt(
  z.object({
    name: z.string().min(1),
    comment: z.string().min(1),
    builtIn: z.boolean().default(false),
  }),
  { type: authRoleEntityType },
);

export const AUTH_DEFAULT_ROLES = [
  {
    name: 'public',
    comment: 'All users (including unauthenticated and authenticated users)',
    builtIn: true,
  },
  {
    name: 'user',
    comment: 'All authenticated users',
    builtIn: true,
  },
  {
    name: 'system',
    comment: 'System processes without a user context, e.g. background jobs',
    builtIn: true,
  },
];

export const auth0PluginDefinitionSchema = z.object({
  userAccountModelRef: zRef(z.string().min(1), {
    type: modelEntityType,
    onDelete: 'RESTRICT',
  }),
  authFeatureRef: zRef(z.string().min(1), {
    type: featureEntityType,
    onDelete: 'RESTRICT',
  }),
  // Always ensure the default roles are present at the top
  roles: z.array(auth0RoleSchema).transform((roles) => [
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
});

export type Auth0PluginDefinition = z.infer<typeof auth0PluginDefinitionSchema>;

export type Auth0PluginDefinitionInput = z.input<
  typeof auth0PluginDefinitionSchema
>;
