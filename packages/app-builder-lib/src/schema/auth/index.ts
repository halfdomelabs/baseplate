import * as yup from 'yup';

export const authRoleSchema = yup.object({
  name: yup.string().required(),
  comment: yup.string().required(),
  inherits: yup.array(yup.string().required()),
});

export type AuthRoleConfig = yup.InferType<typeof authRoleSchema>;

export const authSchema = yup.object({
  userModel: yup.string().required(),
  userRoleModel: yup.string().required(),
  authFeaturePath: yup.string().required(),
  accountsFeaturePath: yup.string().required(),
  passwordProvider: yup.boolean(),
  roles: yup.array(authRoleSchema),
});
