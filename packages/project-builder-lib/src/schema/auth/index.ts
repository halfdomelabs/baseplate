import { z } from 'zod';
import { randomUid } from '@src/utils/randomUid';
import { ReferencesBuilder } from '../references';

export const authRoleSchema = z.object({
  uid: z.string().default(randomUid),
  name: z.string().min(1),
  comment: z.string().min(1),
  inherits: z.array(z.string().min(1)),
});

export type AuthRoleConfig = z.infer<typeof authRoleSchema>;

export const AUTH_DEFAULT_ROLES = [
  {
    name: 'anonymous',
    comment: 'Anonymous role for unauthenticated users',
    inherits: [],
  },
  {
    name: 'user',
    comment: 'Role for authenticated users',
    inherits: ['anonymous'],
  },
];

export const authSchema = z.object({
  userModel: z.string().min(1),
  userRoleModel: z.string().min(1),
  authFeaturePath: z.string().min(1),
  accountsFeaturePath: z.string().min(1),
  passwordProvider: z.boolean().optional(),
  roles: z
    .array(authRoleSchema)
    .refine(
      (roles) =>
        ['anonymous', 'user'].every((name) =>
          roles?.some((r) => r.name === name)
        ),
      { message: 'Anonymous and user role required' }
    ),
});

export type AuthConfig = z.infer<typeof authSchema>;

export function buildAuthReferences(
  config: AuthConfig,
  builder: ReferencesBuilder<AuthConfig | undefined>
): void {
  config.roles.forEach((role) => {
    builder.addReferenceable({
      category: 'role',
      id: role.uid,
      name: role.name,
    });
  });

  builder
    .addReference('userModel', { category: 'model' })
    .addReference('userRoleModel', { category: 'model' })
    .addReference('authFeaturePath', { category: 'feature' })
    .addReference('accountsFeaturePath', { category: 'feature' });
}
