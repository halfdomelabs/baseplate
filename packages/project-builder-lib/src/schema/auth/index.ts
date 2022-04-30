import * as yup from 'yup';
import { randomUid } from '@src/utils/randomUid';
import { MakeUndefinableFieldsOptional } from '@src/utils/types';
import { ReferencesBuilder } from '../references';

export const authRoleSchema = yup.object({
  uid: yup.string().default(randomUid),
  name: yup.string().required(),
  comment: yup.string().required(),
  inherits: yup.array(yup.string().required()),
});

export type AuthRoleConfig = yup.InferType<typeof authRoleSchema>;

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

export const authSchema = yup.object({
  userModel: yup.string().required(),
  userRoleModel: yup.string().required(),
  authFeaturePath: yup.string().required(),
  accountsFeaturePath: yup.string().required(),
  passwordProvider: yup.boolean(),
  roles: yup
    .array(authRoleSchema)
    .required()
    .test('roles', 'Anonymous and user role required', (roles) =>
      ['anonymous', 'user'].every((name) => roles?.some((r) => r.name === name))
    ),
});

export type AuthConfig = MakeUndefinableFieldsOptional<
  yup.InferType<typeof authSchema>
>;

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
