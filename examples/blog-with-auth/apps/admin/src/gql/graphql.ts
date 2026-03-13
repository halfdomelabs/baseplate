/* eslint-disable */
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date string, such as 2007-12-03, compliant with the `full-date` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  Date: { input: string; output: string; }
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: { input: string; output: string; }
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { input: unknown; output: unknown; }
  /** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSONObject: { input: Record<string, unknown>; output: Record<string, unknown>; }
  /** A field whose value is a generic Universally Unique Identifier: https://en.wikipedia.org/wiki/Universally_unique_identifier. */
  Uuid: { input: string; output: string; }
};

export type Article = {
  __typename?: 'Article';
  content: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  title: Scalars['String']['output'];
};

export type AuthRole =
  /** Administrator role */
  | 'admin'
  /** All users (including unauthenticated and authenticated users) */
  | 'public'
  /** System processes without a user context, e.g. background jobs */
  | 'system'
  /** All authenticated users */
  | 'user';

export type Blog = {
  __typename?: 'Blog';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  userId: Scalars['Uuid']['output'];
};

/** Input type for changePassword mutation */
export type ChangePasswordInput = {
  currentPassword: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
};

/** Payload type for changePassword mutation */
export type ChangePasswordPayload = {
  __typename?: 'ChangePasswordPayload';
  user: User;
};

export type CreateArticleData = {
  content: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

/** Input type for createArticle mutation */
export type CreateArticleInput = {
  data: CreateArticleData;
};

/** Payload type for createArticle mutation */
export type CreateArticlePayload = {
  __typename?: 'CreateArticlePayload';
  article: Article;
};

export type CreateUserData = {
  email?: InputMaybe<Scalars['String']['input']>;
  emailVerified?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

/** Input type for createUser mutation */
export type CreateUserInput = {
  data: CreateUserData;
};

/** Payload type for createUser mutation */
export type CreateUserPayload = {
  __typename?: 'CreateUserPayload';
  user: User;
};

/** Input type for deleteBlog mutation */
export type DeleteBlogInput = {
  id: Scalars['Uuid']['input'];
};

/** Payload type for deleteBlog mutation */
export type DeleteBlogPayload = {
  __typename?: 'DeleteBlogPayload';
  blog: Blog;
};

/** Input type for deleteUser mutation */
export type DeleteUserInput = {
  id: Scalars['Uuid']['input'];
};

/** Payload type for deleteUser mutation */
export type DeleteUserPayload = {
  __typename?: 'DeleteUserPayload';
  user: User;
};

/** Payload type for logOut mutation */
export type LogOutPayload = {
  __typename?: 'LogOutPayload';
  /** Whether the logout was successful. */
  success: Scalars['Boolean']['output'];
};

/** Input type for loginWithEmailPassword mutation */
export type LoginWithEmailPasswordInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

/** Payload type for loginWithEmailPassword mutation */
export type LoginWithEmailPasswordPayload = {
  __typename?: 'LoginWithEmailPasswordPayload';
  session: UserSessionPayload;
};

export type Mutation = {
  __typename?: 'Mutation';
  changePassword: ChangePasswordPayload;
  createArticle: CreateArticlePayload;
  createUser: CreateUserPayload;
  deleteBlog: DeleteBlogPayload;
  deleteUser: DeleteUserPayload;
  logOut: LogOutPayload;
  loginWithEmailPassword: LoginWithEmailPasswordPayload;
  registerWithEmailPassword: RegisterWithEmailPasswordPayload;
  requestEmailVerification: RequestEmailVerificationPayload;
  requestPasswordReset: RequestPasswordResetPayload;
  resetPasswordWithToken: ResetPasswordWithTokenPayload;
  resetUserPassword: ResetUserPasswordPayload;
  updateArticle: UpdateArticlePayload;
  updateBlog: UpdateBlogPayload;
  updateUser: UpdateUserPayload;
  updateUserRoles: UpdateUserRolesPayload;
  validatePasswordResetToken: ValidatePasswordResetTokenPayload;
  verifyEmail: VerifyEmailPayload;
};


export type MutationChangePasswordArgs = {
  input: ChangePasswordInput;
};


export type MutationCreateArticleArgs = {
  input: CreateArticleInput;
};


export type MutationCreateUserArgs = {
  input: CreateUserInput;
};


export type MutationDeleteBlogArgs = {
  input: DeleteBlogInput;
};


export type MutationDeleteUserArgs = {
  input: DeleteUserInput;
};


export type MutationLoginWithEmailPasswordArgs = {
  input: LoginWithEmailPasswordInput;
};


export type MutationRegisterWithEmailPasswordArgs = {
  input: RegisterWithEmailPasswordInput;
};


export type MutationRequestPasswordResetArgs = {
  input: RequestPasswordResetInput;
};


export type MutationResetPasswordWithTokenArgs = {
  input: ResetPasswordWithTokenInput;
};


export type MutationResetUserPasswordArgs = {
  input: ResetUserPasswordInput;
};


export type MutationUpdateArticleArgs = {
  input: UpdateArticleInput;
};


export type MutationUpdateBlogArgs = {
  input: UpdateBlogInput;
};


export type MutationUpdateUserArgs = {
  input: UpdateUserInput;
};


export type MutationUpdateUserRolesArgs = {
  input: UpdateUserRolesInput;
};


export type MutationValidatePasswordResetTokenArgs = {
  input: ValidatePasswordResetTokenInput;
};


export type MutationVerifyEmailArgs = {
  input: VerifyEmailInput;
};

export type Query = {
  __typename?: 'Query';
  article: Article;
  articles: Array<Article>;
  blog: Blog;
  blogs: Array<Blog>;
  /** Get the current user session */
  currentUserSession?: Maybe<UserSessionPayload>;
  user: User;
  users: Array<User>;
  /** The currently authenticated user */
  viewer?: Maybe<User>;
};


export type QueryArticleArgs = {
  id: Scalars['Uuid']['input'];
};


export type QueryArticlesArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryBlogArgs = {
  id: Scalars['Uuid']['input'];
};


export type QueryBlogsArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryUserArgs = {
  id: Scalars['Uuid']['input'];
};


export type QueryUsersArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};

/** Input type for registerWithEmailPassword mutation */
export type RegisterWithEmailPasswordInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

/** Payload type for registerWithEmailPassword mutation */
export type RegisterWithEmailPasswordPayload = {
  __typename?: 'RegisterWithEmailPasswordPayload';
  session: UserSessionPayload;
};

/** Payload type for requestEmailVerification mutation */
export type RequestEmailVerificationPayload = {
  __typename?: 'RequestEmailVerificationPayload';
  success: Scalars['Boolean']['output'];
};

/** Input type for requestPasswordReset mutation */
export type RequestPasswordResetInput = {
  email: Scalars['String']['input'];
};

/** Payload type for requestPasswordReset mutation */
export type RequestPasswordResetPayload = {
  __typename?: 'RequestPasswordResetPayload';
  success: Scalars['Boolean']['output'];
};

/** Input type for resetPasswordWithToken mutation */
export type ResetPasswordWithTokenInput = {
  newPassword: Scalars['String']['input'];
  token: Scalars['String']['input'];
};

/** Payload type for resetPasswordWithToken mutation */
export type ResetPasswordWithTokenPayload = {
  __typename?: 'ResetPasswordWithTokenPayload';
  success: Scalars['Boolean']['output'];
};

/** Input type for resetUserPassword mutation */
export type ResetUserPasswordInput = {
  newPassword: Scalars['String']['input'];
  userId: Scalars['Uuid']['input'];
};

/** Payload type for resetUserPassword mutation */
export type ResetUserPasswordPayload = {
  __typename?: 'ResetUserPasswordPayload';
  user: User;
};

export type UpdateArticleData = {
  content?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

/** Input type for updateArticle mutation */
export type UpdateArticleInput = {
  data: UpdateArticleData;
  id: Scalars['Uuid']['input'];
};

/** Payload type for updateArticle mutation */
export type UpdateArticlePayload = {
  __typename?: 'UpdateArticlePayload';
  article: Article;
};

export type UpdateBlogData = {
  name?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['Uuid']['input']>;
};

/** Input type for updateBlog mutation */
export type UpdateBlogInput = {
  data: UpdateBlogData;
  id: Scalars['Uuid']['input'];
};

/** Payload type for updateBlog mutation */
export type UpdateBlogPayload = {
  __typename?: 'UpdateBlogPayload';
  blog: Blog;
};

export type UpdateUserData = {
  email?: InputMaybe<Scalars['String']['input']>;
  emailVerified?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

/** Input type for updateUser mutation */
export type UpdateUserInput = {
  data: UpdateUserData;
  id: Scalars['Uuid']['input'];
};

/** Payload type for updateUser mutation */
export type UpdateUserPayload = {
  __typename?: 'UpdateUserPayload';
  user: User;
};

/** Input type for updateUserRoles mutation */
export type UpdateUserRolesInput = {
  roles: Array<Scalars['String']['input']>;
  userId: Scalars['Uuid']['input'];
};

/** Payload type for updateUserRoles mutation */
export type UpdateUserRolesPayload = {
  __typename?: 'UpdateUserRolesPayload';
  user: User;
};

export type User = {
  __typename?: 'User';
  email?: Maybe<Scalars['String']['output']>;
  emailVerified: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  name?: Maybe<Scalars['String']['output']>;
  roles: Array<UserRole>;
};

export type UserRole = {
  __typename?: 'UserRole';
  role: Scalars['String']['output'];
  userId: Scalars['Uuid']['output'];
};

export type UserSessionPayload = {
  __typename?: 'UserSessionPayload';
  expiresAt?: Maybe<Scalars['DateTime']['output']>;
  roles: Array<AuthRole>;
  user: User;
  userId: Scalars['Uuid']['output'];
};

/** Input type for validatePasswordResetToken mutation */
export type ValidatePasswordResetTokenInput = {
  token: Scalars['String']['input'];
};

/** Payload type for validatePasswordResetToken mutation */
export type ValidatePasswordResetTokenPayload = {
  __typename?: 'ValidatePasswordResetTokenPayload';
  success: Scalars['Boolean']['output'];
};

/** Input type for verifyEmail mutation */
export type VerifyEmailInput = {
  token: Scalars['String']['input'];
};

/** Payload type for verifyEmail mutation */
export type VerifyEmailPayload = {
  __typename?: 'VerifyEmailPayload';
  success: Scalars['Boolean']['output'];
};

export type CurrentUserSessionQueryVariables = Exact<{ [key: string]: never; }>;


export type CurrentUserSessionQuery = { __typename?: 'Query', currentUserSession?: { __typename?: 'UserSessionPayload', userId: string, roles: Array<AuthRole> } | null };

export type LogOutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogOutMutation = { __typename?: 'Mutation', logOut: { __typename?: 'LogOutPayload', success: boolean } };

export type UserEditPageQueryVariables = Exact<{
  id: Scalars['Uuid']['input'];
}>;


export type UserEditPageQuery = { __typename?: 'Query', user: (
    { __typename?: 'User', id: string, name?: string | null }
    & { ' $fragmentRefs'?: { 'UserEditForm_DefaultValuesFragment': UserEditForm_DefaultValuesFragment } }
  ) };

export type UserEditPageUpdateMutationVariables = Exact<{
  input: UpdateUserInput;
}>;


export type UserEditPageUpdateMutation = { __typename?: 'Mutation', updateUser: { __typename?: 'UpdateUserPayload', user: (
      { __typename?: 'User', id: string, name?: string | null }
      & { ' $fragmentRefs'?: { 'UserEditForm_DefaultValuesFragment': UserEditForm_DefaultValuesFragment } }
    ) } };

export type PasswordResetDialog_UserFragment = { __typename?: 'User', id: string, name?: string | null, email?: string | null } & { ' $fragmentName'?: 'PasswordResetDialog_UserFragment' };

export type ResetUserPasswordMutationVariables = Exact<{
  input: ResetUserPasswordInput;
}>;


export type ResetUserPasswordMutation = { __typename?: 'Mutation', resetUserPassword: { __typename?: 'ResetUserPasswordPayload', user: (
      { __typename?: 'User' }
      & { ' $fragmentRefs'?: { 'PasswordResetDialog_UserFragment': PasswordResetDialog_UserFragment } }
    ) } };

export type RoleManagerDialog_UserFragment = { __typename?: 'User', id: string, name?: string | null, email?: string | null, roles: Array<{ __typename?: 'UserRole', role: string }> } & { ' $fragmentName'?: 'RoleManagerDialog_UserFragment' };

export type UpdateUserRolesMutationVariables = Exact<{
  input: UpdateUserRolesInput;
}>;


export type UpdateUserRolesMutation = { __typename?: 'Mutation', updateUserRoles: { __typename?: 'UpdateUserRolesPayload', user: (
      { __typename?: 'User' }
      & { ' $fragmentRefs'?: { 'RoleManagerDialog_UserFragment': RoleManagerDialog_UserFragment } }
    ) } };

export type UserEditForm_DefaultValuesFragment = { __typename?: 'User', email?: string | null, id: string, name?: string | null } & { ' $fragmentName'?: 'UserEditForm_DefaultValuesFragment' };

export type UserListPageDeleteUserMutationVariables = Exact<{
  input: DeleteUserInput;
}>;


export type UserListPageDeleteUserMutation = { __typename?: 'Mutation', deleteUser: { __typename?: 'DeleteUserPayload', user: { __typename?: 'User', id: string, name?: string | null } } };

export type UserTable_ItemsFragment = (
  { __typename?: 'User', email?: string | null, id: string, name?: string | null, roles: Array<{ __typename?: 'UserRole', role: string }> }
  & { ' $fragmentRefs'?: { 'PasswordResetDialog_UserFragment': PasswordResetDialog_UserFragment;'RoleManagerDialog_UserFragment': RoleManagerDialog_UserFragment } }
) & { ' $fragmentName'?: 'UserTable_ItemsFragment' };

export type UserListPageQueryVariables = Exact<{ [key: string]: never; }>;


export type UserListPageQuery = { __typename?: 'Query', users: Array<(
    { __typename?: 'User' }
    & { ' $fragmentRefs'?: { 'UserTable_ItemsFragment': UserTable_ItemsFragment } }
  )> };

export type UserCreatePageCreateMutationVariables = Exact<{
  input: CreateUserInput;
}>;


export type UserCreatePageCreateMutation = { __typename?: 'Mutation', createUser: { __typename?: 'CreateUserPayload', user: { __typename?: 'User', id: string } } };

export type HomePageQueryVariables = Exact<{ [key: string]: never; }>;


export type HomePageQuery = { __typename?: 'Query', viewer?: { __typename?: 'User', id: string, email?: string | null } | null };

export type RequestPasswordResetMutationVariables = Exact<{
  input: RequestPasswordResetInput;
}>;


export type RequestPasswordResetMutation = { __typename?: 'Mutation', requestPasswordReset: { __typename?: 'RequestPasswordResetPayload', success: boolean } };

export type LoginWithEmailPasswordMutationVariables = Exact<{
  input: LoginWithEmailPasswordInput;
}>;


export type LoginWithEmailPasswordMutation = { __typename?: 'Mutation', loginWithEmailPassword: { __typename?: 'LoginWithEmailPasswordPayload', session: { __typename?: 'UserSessionPayload', userId: string } } };

export type RegisterWithEmailPasswordMutationVariables = Exact<{
  input: RegisterWithEmailPasswordInput;
}>;


export type RegisterWithEmailPasswordMutation = { __typename?: 'Mutation', registerWithEmailPassword: { __typename?: 'RegisterWithEmailPasswordPayload', session: { __typename?: 'UserSessionPayload', userId: string } } };

export type ValidatePasswordResetTokenMutationVariables = Exact<{
  input: ValidatePasswordResetTokenInput;
}>;


export type ValidatePasswordResetTokenMutation = { __typename?: 'Mutation', validatePasswordResetToken: { __typename?: 'ValidatePasswordResetTokenPayload', success: boolean } };

export type ResetPasswordWithTokenMutationVariables = Exact<{
  input: ResetPasswordWithTokenInput;
}>;


export type ResetPasswordWithTokenMutation = { __typename?: 'Mutation', resetPasswordWithToken: { __typename?: 'ResetPasswordWithTokenPayload', success: boolean } };

export type VerifyEmailMutationVariables = Exact<{
  input: VerifyEmailInput;
}>;


export type VerifyEmailMutation = { __typename?: 'Mutation', verifyEmail: { __typename?: 'VerifyEmailPayload', success: boolean } };

export type RequestEmailVerificationMutationVariables = Exact<{ [key: string]: never; }>;


export type RequestEmailVerificationMutation = { __typename?: 'Mutation', requestEmailVerification: { __typename?: 'RequestEmailVerificationPayload', success: boolean } };

export const UserEditForm_DefaultValuesFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserEditForm_defaultValues"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]} as unknown as DocumentNode<UserEditForm_DefaultValuesFragment, unknown>;
export const PasswordResetDialog_UserFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PasswordResetDialog_user"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]} as unknown as DocumentNode<PasswordResetDialog_UserFragment, unknown>;
export const RoleManagerDialog_UserFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RoleManagerDialog_user"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"roles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]} as unknown as DocumentNode<RoleManagerDialog_UserFragment, unknown>;
export const UserTable_ItemsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserTable_items"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"PasswordResetDialog_user"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"RoleManagerDialog_user"}},{"kind":"Field","name":{"kind":"Name","value":"roles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PasswordResetDialog_user"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RoleManagerDialog_user"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"roles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]} as unknown as DocumentNode<UserTable_ItemsFragment, unknown>;
export const CurrentUserSessionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CurrentUserSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentUserSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"roles"}}]}}]}}]} as unknown as DocumentNode<CurrentUserSessionQuery, CurrentUserSessionQueryVariables>;
export const LogOutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"LogOut"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logOut"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<LogOutMutation, LogOutMutationVariables>;
export const UserEditPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UserEditPage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Uuid"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserEditForm_defaultValues"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserEditForm_defaultValues"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]} as unknown as DocumentNode<UserEditPageQuery, UserEditPageQueryVariables>;
export const UserEditPageUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UserEditPageUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserEditForm_defaultValues"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserEditForm_defaultValues"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]} as unknown as DocumentNode<UserEditPageUpdateMutation, UserEditPageUpdateMutationVariables>;
export const ResetUserPasswordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ResetUserPassword"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ResetUserPasswordInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resetUserPassword"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PasswordResetDialog_user"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PasswordResetDialog_user"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]} as unknown as DocumentNode<ResetUserPasswordMutation, ResetUserPasswordMutationVariables>;
export const UpdateUserRolesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateUserRoles"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateUserRolesInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUserRoles"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RoleManagerDialog_user"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RoleManagerDialog_user"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"roles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]} as unknown as DocumentNode<UpdateUserRolesMutation, UpdateUserRolesMutationVariables>;
export const UserListPageDeleteUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UserListPageDeleteUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<UserListPageDeleteUserMutation, UserListPageDeleteUserMutationVariables>;
export const UserListPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UserListPage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserTable_items"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PasswordResetDialog_user"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RoleManagerDialog_user"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"roles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserTable_items"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"PasswordResetDialog_user"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"RoleManagerDialog_user"}},{"kind":"Field","name":{"kind":"Name","value":"roles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]} as unknown as DocumentNode<UserListPageQuery, UserListPageQueryVariables>;
export const UserCreatePageCreateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UserCreatePageCreate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<UserCreatePageCreateMutation, UserCreatePageCreateMutationVariables>;
export const HomePageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"HomePage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"viewer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]} as unknown as DocumentNode<HomePageQuery, HomePageQueryVariables>;
export const RequestPasswordResetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestPasswordReset"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RequestPasswordResetInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestPasswordReset"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<RequestPasswordResetMutation, RequestPasswordResetMutationVariables>;
export const LoginWithEmailPasswordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"LoginWithEmailPassword"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LoginWithEmailPasswordInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"loginWithEmailPassword"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"session"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userId"}}]}}]}}]}}]} as unknown as DocumentNode<LoginWithEmailPasswordMutation, LoginWithEmailPasswordMutationVariables>;
export const RegisterWithEmailPasswordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RegisterWithEmailPassword"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RegisterWithEmailPasswordInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"registerWithEmailPassword"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"session"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userId"}}]}}]}}]}}]} as unknown as DocumentNode<RegisterWithEmailPasswordMutation, RegisterWithEmailPasswordMutationVariables>;
export const ValidatePasswordResetTokenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ValidatePasswordResetToken"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ValidatePasswordResetTokenInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"validatePasswordResetToken"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<ValidatePasswordResetTokenMutation, ValidatePasswordResetTokenMutationVariables>;
export const ResetPasswordWithTokenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ResetPasswordWithToken"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ResetPasswordWithTokenInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resetPasswordWithToken"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<ResetPasswordWithTokenMutation, ResetPasswordWithTokenMutationVariables>;
export const VerifyEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"VerifyEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"VerifyEmailInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"verifyEmail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<VerifyEmailMutation, VerifyEmailMutationVariables>;
export const RequestEmailVerificationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestEmailVerification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestEmailVerification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<RequestEmailVerificationMutation, RequestEmailVerificationMutationVariables>;