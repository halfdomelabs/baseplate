/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query CurrentUserSession {\n    currentUserSession {\n      userId\n      roles\n    }\n  }\n": typeof types.CurrentUserSessionDocument,
    "\n  mutation LogOut {\n    logOut {\n      success\n    }\n  }\n": typeof types.LogOutDocument,
    "\n  query UserEditPage($id: Uuid!) {\n    user(id: $id) {\n      id\n      name\n      ...UserEditForm_defaultValues\n    }\n  }\n": typeof types.UserEditPageDocument,
    "\n  mutation UserEditPageUpdate($input: UpdateUserInput!) {\n    updateUser(input: $input) {\n      user {\n        id\n        name\n        ...UserEditForm_defaultValues\n      }\n    }\n  }\n": typeof types.UserEditPageUpdateDocument,
    "\n  fragment PasswordResetDialog_user on User {\n    id\n    name\n    email\n  }\n": typeof types.PasswordResetDialog_UserFragmentDoc,
    "\n  mutation ResetUserPassword($input: ResetUserPasswordInput!) {\n    resetUserPassword(input: $input) {\n      user {\n        ...PasswordResetDialog_user\n      }\n    }\n  }\n": typeof types.ResetUserPasswordDocument,
    "\n  fragment RoleManagerDialog_user on User {\n    id\n    name\n    email\n    roles {\n      role\n    }\n  }\n": typeof types.RoleManagerDialog_UserFragmentDoc,
    "\n  mutation UpdateUserRoles($input: UpdateUserRolesInput!) {\n    updateUserRoles(input: $input) {\n      user {\n        ...RoleManagerDialog_user\n      }\n    }\n  }\n": typeof types.UpdateUserRolesDocument,
    "\n  fragment UserEditForm_defaultValues on User {\n    email\n    id\n    name\n  }\n": typeof types.UserEditForm_DefaultValuesFragmentDoc,
    "\n  mutation UserListPageDeleteUser($input: DeleteUserInput!) {\n    deleteUser(input: $input) {\n      user {\n        id\n        name\n      }\n    }\n  }\n": typeof types.UserListPageDeleteUserDocument,
    "\n  fragment UserTable_items on User {\n    email\n    id\n    name\n    ...PasswordResetDialog_user\n    ...RoleManagerDialog_user\n    roles {\n      role\n    }\n  }\n": typeof types.UserTable_ItemsFragmentDoc,
    "\n  query UserListPage {\n    users {\n      ...UserTable_items\n    }\n  }\n": typeof types.UserListPageDocument,
    "\n  mutation UserCreatePageCreate($input: CreateUserInput!) {\n    createUser(input: $input) {\n      user {\n        id\n      }\n    }\n  }\n": typeof types.UserCreatePageCreateDocument,
    "\n  query HomePage {\n    viewer {\n      id\n      email\n    }\n  }\n": typeof types.HomePageDocument,
    "\n  mutation RequestPasswordReset($input: RequestPasswordResetInput!) {\n    requestPasswordReset(input: $input) {\n      success\n    }\n  }\n": typeof types.RequestPasswordResetDocument,
    "\n  mutation LoginWithEmailPassword($input: LoginWithEmailPasswordInput!) {\n    loginWithEmailPassword(input: $input) {\n      session {\n        userId\n      }\n    }\n  }\n": typeof types.LoginWithEmailPasswordDocument,
    "\n  mutation RegisterWithEmailPassword($input: RegisterWithEmailPasswordInput!) {\n    registerWithEmailPassword(input: $input) {\n      session {\n        userId\n      }\n    }\n  }\n": typeof types.RegisterWithEmailPasswordDocument,
    "\n  mutation ValidatePasswordResetToken(\n    $input: ValidatePasswordResetTokenInput!\n  ) {\n    validatePasswordResetToken(input: $input) {\n      success\n    }\n  }\n": typeof types.ValidatePasswordResetTokenDocument,
    "\n  mutation ResetPasswordWithToken($input: ResetPasswordWithTokenInput!) {\n    resetPasswordWithToken(input: $input) {\n      success\n    }\n  }\n": typeof types.ResetPasswordWithTokenDocument,
    "\n  mutation VerifyEmail($input: VerifyEmailInput!) {\n    verifyEmail(input: $input) {\n      success\n    }\n  }\n": typeof types.VerifyEmailDocument,
    "\n  mutation RequestEmailVerification {\n    requestEmailVerification {\n      success\n    }\n  }\n": typeof types.RequestEmailVerificationDocument,
};
const documents: Documents = {
    "\n  query CurrentUserSession {\n    currentUserSession {\n      userId\n      roles\n    }\n  }\n": types.CurrentUserSessionDocument,
    "\n  mutation LogOut {\n    logOut {\n      success\n    }\n  }\n": types.LogOutDocument,
    "\n  query UserEditPage($id: Uuid!) {\n    user(id: $id) {\n      id\n      name\n      ...UserEditForm_defaultValues\n    }\n  }\n": types.UserEditPageDocument,
    "\n  mutation UserEditPageUpdate($input: UpdateUserInput!) {\n    updateUser(input: $input) {\n      user {\n        id\n        name\n        ...UserEditForm_defaultValues\n      }\n    }\n  }\n": types.UserEditPageUpdateDocument,
    "\n  fragment PasswordResetDialog_user on User {\n    id\n    name\n    email\n  }\n": types.PasswordResetDialog_UserFragmentDoc,
    "\n  mutation ResetUserPassword($input: ResetUserPasswordInput!) {\n    resetUserPassword(input: $input) {\n      user {\n        ...PasswordResetDialog_user\n      }\n    }\n  }\n": types.ResetUserPasswordDocument,
    "\n  fragment RoleManagerDialog_user on User {\n    id\n    name\n    email\n    roles {\n      role\n    }\n  }\n": types.RoleManagerDialog_UserFragmentDoc,
    "\n  mutation UpdateUserRoles($input: UpdateUserRolesInput!) {\n    updateUserRoles(input: $input) {\n      user {\n        ...RoleManagerDialog_user\n      }\n    }\n  }\n": types.UpdateUserRolesDocument,
    "\n  fragment UserEditForm_defaultValues on User {\n    email\n    id\n    name\n  }\n": types.UserEditForm_DefaultValuesFragmentDoc,
    "\n  mutation UserListPageDeleteUser($input: DeleteUserInput!) {\n    deleteUser(input: $input) {\n      user {\n        id\n        name\n      }\n    }\n  }\n": types.UserListPageDeleteUserDocument,
    "\n  fragment UserTable_items on User {\n    email\n    id\n    name\n    ...PasswordResetDialog_user\n    ...RoleManagerDialog_user\n    roles {\n      role\n    }\n  }\n": types.UserTable_ItemsFragmentDoc,
    "\n  query UserListPage {\n    users {\n      ...UserTable_items\n    }\n  }\n": types.UserListPageDocument,
    "\n  mutation UserCreatePageCreate($input: CreateUserInput!) {\n    createUser(input: $input) {\n      user {\n        id\n      }\n    }\n  }\n": types.UserCreatePageCreateDocument,
    "\n  query HomePage {\n    viewer {\n      id\n      email\n    }\n  }\n": types.HomePageDocument,
    "\n  mutation RequestPasswordReset($input: RequestPasswordResetInput!) {\n    requestPasswordReset(input: $input) {\n      success\n    }\n  }\n": types.RequestPasswordResetDocument,
    "\n  mutation LoginWithEmailPassword($input: LoginWithEmailPasswordInput!) {\n    loginWithEmailPassword(input: $input) {\n      session {\n        userId\n      }\n    }\n  }\n": types.LoginWithEmailPasswordDocument,
    "\n  mutation RegisterWithEmailPassword($input: RegisterWithEmailPasswordInput!) {\n    registerWithEmailPassword(input: $input) {\n      session {\n        userId\n      }\n    }\n  }\n": types.RegisterWithEmailPasswordDocument,
    "\n  mutation ValidatePasswordResetToken(\n    $input: ValidatePasswordResetTokenInput!\n  ) {\n    validatePasswordResetToken(input: $input) {\n      success\n    }\n  }\n": types.ValidatePasswordResetTokenDocument,
    "\n  mutation ResetPasswordWithToken($input: ResetPasswordWithTokenInput!) {\n    resetPasswordWithToken(input: $input) {\n      success\n    }\n  }\n": types.ResetPasswordWithTokenDocument,
    "\n  mutation VerifyEmail($input: VerifyEmailInput!) {\n    verifyEmail(input: $input) {\n      success\n    }\n  }\n": types.VerifyEmailDocument,
    "\n  mutation RequestEmailVerification {\n    requestEmailVerification {\n      success\n    }\n  }\n": types.RequestEmailVerificationDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CurrentUserSession {\n    currentUserSession {\n      userId\n      roles\n    }\n  }\n"): (typeof documents)["\n  query CurrentUserSession {\n    currentUserSession {\n      userId\n      roles\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation LogOut {\n    logOut {\n      success\n    }\n  }\n"): (typeof documents)["\n  mutation LogOut {\n    logOut {\n      success\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query UserEditPage($id: Uuid!) {\n    user(id: $id) {\n      id\n      name\n      ...UserEditForm_defaultValues\n    }\n  }\n"): (typeof documents)["\n  query UserEditPage($id: Uuid!) {\n    user(id: $id) {\n      id\n      name\n      ...UserEditForm_defaultValues\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UserEditPageUpdate($input: UpdateUserInput!) {\n    updateUser(input: $input) {\n      user {\n        id\n        name\n        ...UserEditForm_defaultValues\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation UserEditPageUpdate($input: UpdateUserInput!) {\n    updateUser(input: $input) {\n      user {\n        id\n        name\n        ...UserEditForm_defaultValues\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment PasswordResetDialog_user on User {\n    id\n    name\n    email\n  }\n"): (typeof documents)["\n  fragment PasswordResetDialog_user on User {\n    id\n    name\n    email\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ResetUserPassword($input: ResetUserPasswordInput!) {\n    resetUserPassword(input: $input) {\n      user {\n        ...PasswordResetDialog_user\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation ResetUserPassword($input: ResetUserPasswordInput!) {\n    resetUserPassword(input: $input) {\n      user {\n        ...PasswordResetDialog_user\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment RoleManagerDialog_user on User {\n    id\n    name\n    email\n    roles {\n      role\n    }\n  }\n"): (typeof documents)["\n  fragment RoleManagerDialog_user on User {\n    id\n    name\n    email\n    roles {\n      role\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateUserRoles($input: UpdateUserRolesInput!) {\n    updateUserRoles(input: $input) {\n      user {\n        ...RoleManagerDialog_user\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateUserRoles($input: UpdateUserRolesInput!) {\n    updateUserRoles(input: $input) {\n      user {\n        ...RoleManagerDialog_user\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment UserEditForm_defaultValues on User {\n    email\n    id\n    name\n  }\n"): (typeof documents)["\n  fragment UserEditForm_defaultValues on User {\n    email\n    id\n    name\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UserListPageDeleteUser($input: DeleteUserInput!) {\n    deleteUser(input: $input) {\n      user {\n        id\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation UserListPageDeleteUser($input: DeleteUserInput!) {\n    deleteUser(input: $input) {\n      user {\n        id\n        name\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment UserTable_items on User {\n    email\n    id\n    name\n    ...PasswordResetDialog_user\n    ...RoleManagerDialog_user\n    roles {\n      role\n    }\n  }\n"): (typeof documents)["\n  fragment UserTable_items on User {\n    email\n    id\n    name\n    ...PasswordResetDialog_user\n    ...RoleManagerDialog_user\n    roles {\n      role\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query UserListPage {\n    users {\n      ...UserTable_items\n    }\n  }\n"): (typeof documents)["\n  query UserListPage {\n    users {\n      ...UserTable_items\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UserCreatePageCreate($input: CreateUserInput!) {\n    createUser(input: $input) {\n      user {\n        id\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation UserCreatePageCreate($input: CreateUserInput!) {\n    createUser(input: $input) {\n      user {\n        id\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query HomePage {\n    viewer {\n      id\n      email\n    }\n  }\n"): (typeof documents)["\n  query HomePage {\n    viewer {\n      id\n      email\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RequestPasswordReset($input: RequestPasswordResetInput!) {\n    requestPasswordReset(input: $input) {\n      success\n    }\n  }\n"): (typeof documents)["\n  mutation RequestPasswordReset($input: RequestPasswordResetInput!) {\n    requestPasswordReset(input: $input) {\n      success\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation LoginWithEmailPassword($input: LoginWithEmailPasswordInput!) {\n    loginWithEmailPassword(input: $input) {\n      session {\n        userId\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation LoginWithEmailPassword($input: LoginWithEmailPasswordInput!) {\n    loginWithEmailPassword(input: $input) {\n      session {\n        userId\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RegisterWithEmailPassword($input: RegisterWithEmailPasswordInput!) {\n    registerWithEmailPassword(input: $input) {\n      session {\n        userId\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation RegisterWithEmailPassword($input: RegisterWithEmailPasswordInput!) {\n    registerWithEmailPassword(input: $input) {\n      session {\n        userId\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ValidatePasswordResetToken(\n    $input: ValidatePasswordResetTokenInput!\n  ) {\n    validatePasswordResetToken(input: $input) {\n      success\n    }\n  }\n"): (typeof documents)["\n  mutation ValidatePasswordResetToken(\n    $input: ValidatePasswordResetTokenInput!\n  ) {\n    validatePasswordResetToken(input: $input) {\n      success\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ResetPasswordWithToken($input: ResetPasswordWithTokenInput!) {\n    resetPasswordWithToken(input: $input) {\n      success\n    }\n  }\n"): (typeof documents)["\n  mutation ResetPasswordWithToken($input: ResetPasswordWithTokenInput!) {\n    resetPasswordWithToken(input: $input) {\n      success\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation VerifyEmail($input: VerifyEmailInput!) {\n    verifyEmail(input: $input) {\n      success\n    }\n  }\n"): (typeof documents)["\n  mutation VerifyEmail($input: VerifyEmailInput!) {\n    verifyEmail(input: $input) {\n      success\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RequestEmailVerification {\n    requestEmailVerification {\n      success\n    }\n  }\n"): (typeof documents)["\n  mutation RequestEmailVerification {\n    requestEmailVerification {\n      success\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;