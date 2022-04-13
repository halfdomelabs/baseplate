import * as yup from 'yup';
import { randomUid } from '@src/utils/randomUid';

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

export type AuthConfig = yup.InferType<typeof authSchema>;
