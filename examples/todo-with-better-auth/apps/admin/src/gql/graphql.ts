/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
/** Input type for createPresignedUploadUrl mutation */
export type CreatePresignedUploadUrlInput = {
  category: FileCategory;
  contentType: string;
  filename: string;
  size: number;
};

export type CreateTodoListData = {
  coverPhoto?: FileInput | null | undefined;
  createdAt?: string | null | undefined;
  name: string;
  ownerId: string;
  position: number;
  status?: TodoListStatus | null | undefined;
};

/** Input type for createTodoList mutation */
export type CreateTodoListInput = {
  data: CreateTodoListData;
};

/** Input type for deleteTodoList mutation */
export type DeleteTodoListInput = {
  id: string;
};

/** Input type for deleteUser mutation */
export type DeleteUserInput = {
  id: string;
};

export type FileCategory =
  | 'TODO_LIST_COVER_PHOTO'
  | 'USER_IMAGE_FILE'
  | 'USER_PROFILE_AVATAR';

/** Input representing an uploaded file */
export type FileInput = {
  id: string;
  /** Discarded but useful for forms */
  name?: string | null | undefined;
};

/** Input type for resetUserPassword mutation */
export type ResetUserPasswordInput = {
  newPassword: string;
  userId: string;
};

export type TodoListStatus =
  | 'ACTIVE'
  | 'INACTIVE';

export type UpdateTodoListData = {
  coverPhoto?: FileInput | null | undefined;
  createdAt?: string | null | undefined;
  name?: string | null | undefined;
  ownerId?: string | null | undefined;
  position?: number | null | undefined;
  status?: TodoListStatus | null | undefined;
};

/** Input type for updateTodoList mutation */
export type UpdateTodoListInput = {
  data: UpdateTodoListData;
  id: string;
};

export type UpdateUserData = {
  customer?: UserCustomerNestedInput | null | undefined;
  email?: string | null | undefined;
  images?: Array<UserImagesNestedInput> | null | undefined;
  name?: string | null | undefined;
  roles?: Array<UserRolesNestedInput> | null | undefined;
  userProfile?: UserUserProfileNestedInput | null | undefined;
};

/** Input type for updateUser mutation */
export type UpdateUserInput = {
  data: UpdateUserData;
  id: string;
};

/** Input type for updateUserRoles mutation */
export type UpdateUserRolesInput = {
  roles: Array<string>;
  userId: string;
};

export type UserCustomerNestedInput = {
  stripeCustomerId: string;
};

export type UserImagesNestedInput = {
  caption: string;
  file: FileInput;
  id?: string | number | null | undefined;
};

export type UserRolesNestedInput = {
  role: string;
};

export type UserUserProfileNestedInput = {
  avatar?: FileInput | null | undefined;
  bio?: string | null | undefined;
  birthDay?: string | null | undefined;
  favoriteTodoListId?: string | null | undefined;
  id?: string | number | null | undefined;
};

export type FileInput_ValueFragment = { id: string, filename: string, publicUrl: string | null } & { ' $fragmentName'?: 'FileInput_ValueFragment' };

export type FileInputCreateUploadUrlMutationVariables = Exact<{
  input: CreatePresignedUploadUrlInput;
}>;


export type FileInputCreateUploadUrlMutation = { createPresignedUploadUrl: { url: string, method: string, fields: Array<{ name: string, value: string }> | null, file: (
      { id: string, filename: string, publicUrl: string | null }
      & { ' $fragmentRefs'?: { 'FileInput_ValueFragment': FileInput_ValueFragment } }
    ) } };

export type UserEditPageQueryVariables = Exact<{
  id: string;
}>;


export type UserEditPageQuery = { user: (
    { id: string, name: string }
    & { ' $fragmentRefs'?: { 'UserEditForm_DefaultValuesFragment': UserEditForm_DefaultValuesFragment } }
  ) };

export type UserEditPageUpdateMutationVariables = Exact<{
  input: UpdateUserInput;
}>;


export type UserEditPageUpdateMutation = { updateUser: { user: (
      { id: string, name: string }
      & { ' $fragmentRefs'?: { 'UserEditForm_DefaultValuesFragment': UserEditForm_DefaultValuesFragment } }
    ) } };

export type PasswordResetDialog_UserFragment = { id: string, name: string, email: string } & { ' $fragmentName'?: 'PasswordResetDialog_UserFragment' };

export type ResetUserPasswordMutationVariables = Exact<{
  input: ResetUserPasswordInput;
}>;


export type ResetUserPasswordMutation = { resetUserPassword: { user: { ' $fragmentRefs'?: { 'PasswordResetDialog_UserFragment': PasswordResetDialog_UserFragment } } } };

export type RoleManagerDialog_UserFragment = { id: string, name: string, email: string, roles: Array<{ role: string }> } & { ' $fragmentName'?: 'RoleManagerDialog_UserFragment' };

export type UpdateUserRolesMutationVariables = Exact<{
  input: UpdateUserRolesInput;
}>;


export type UpdateUserRolesMutation = { updateUserRoles: { user: { ' $fragmentRefs'?: { 'RoleManagerDialog_UserFragment': RoleManagerDialog_UserFragment } } } };

export type UserEditForm_DefaultValuesFragment = { email: string, id: string, name: string, customer: { id: string, stripeCustomerId: string } | null } & { ' $fragmentName'?: 'UserEditForm_DefaultValuesFragment' };

export type UserListPageDeleteUserMutationVariables = Exact<{
  input: DeleteUserInput;
}>;


export type UserListPageDeleteUserMutation = { deleteUser: { user: { id: string, name: string } } };

export type UserTable_ItemsFragment = (
  { email: string, id: string, name: string }
  & { ' $fragmentRefs'?: { 'PasswordResetDialog_UserFragment': PasswordResetDialog_UserFragment;'RoleManagerDialog_UserFragment': RoleManagerDialog_UserFragment } }
) & { ' $fragmentName'?: 'UserTable_ItemsFragment' };

export type UserListPageQueryVariables = Exact<{ [key: string]: never; }>;


export type UserListPageQuery = { users: Array<{ ' $fragmentRefs'?: { 'UserTable_ItemsFragment': UserTable_ItemsFragment } }> };

export type HomePageQueryVariables = Exact<{ [key: string]: never; }>;


export type HomePageQuery = { viewer: { id: string, email: string } | null };

export type TodoListEditPageQueryVariables = Exact<{
  id: string;
}>;


export type TodoListEditPageQuery = { todoList: (
    { id: string, name: string }
    & { ' $fragmentRefs'?: { 'TodoListEditForm_DefaultValuesFragment': TodoListEditForm_DefaultValuesFragment } }
  ) };

export type TodoListEditPageUpdateMutationVariables = Exact<{
  input: UpdateTodoListInput;
}>;


export type TodoListEditPageUpdateMutation = { updateTodoList: { todoList: (
      { id: string, name: string }
      & { ' $fragmentRefs'?: { 'TodoListEditForm_DefaultValuesFragment': TodoListEditForm_DefaultValuesFragment } }
    ) } };

export type TodoListEditForm_OwnerOptionsFragment = { id: string, name: string } & { ' $fragmentName'?: 'TodoListEditForm_OwnerOptionsFragment' };

export type TodoListEditFormOwnerOptionsQueryVariables = Exact<{ [key: string]: never; }>;


export type TodoListEditFormOwnerOptionsQuery = { users: Array<{ ' $fragmentRefs'?: { 'TodoListEditForm_OwnerOptionsFragment': TodoListEditForm_OwnerOptionsFragment } }> };

export type TodoListEditForm_DefaultValuesFragment = { createdAt: string, id: string, name: string, ownerId: string, position: number, status: TodoListStatus | null, coverPhoto: { filename: string, id: string } | null } & { ' $fragmentName'?: 'TodoListEditForm_DefaultValuesFragment' };

export type TodoListListPageDeleteTodoListMutationVariables = Exact<{
  input: DeleteTodoListInput;
}>;


export type TodoListListPageDeleteTodoListMutation = { deleteTodoList: { todoList: { id: string, name: string } } };

export type TodoListTable_ItemsFragment = { createdAt: string, id: string, name: string, ownerId: string } & { ' $fragmentName'?: 'TodoListTable_ItemsFragment' };

export type TodoListListPageQueryVariables = Exact<{ [key: string]: never; }>;


export type TodoListListPageQuery = { todoLists: Array<{ ' $fragmentRefs'?: { 'TodoListTable_ItemsFragment': TodoListTable_ItemsFragment } }> };

export type TodoListCreatePageCreateMutationVariables = Exact<{
  input: CreateTodoListInput;
}>;


export type TodoListCreatePageCreateMutation = { createTodoList: { todoList: { id: string } } };

export const FileInput_ValueFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FileInput_value"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"File"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"filename"}},{"kind":"Field","name":{"kind":"Name","value":"publicUrl"}}]}}]} as unknown as DocumentNode<FileInput_ValueFragment, unknown>;
export const UserEditForm_DefaultValuesFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserEditForm_defaultValues"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"customer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"stripeCustomerId"}}]}}]}}]} as unknown as DocumentNode<UserEditForm_DefaultValuesFragment, unknown>;
export const PasswordResetDialog_UserFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PasswordResetDialog_user"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]} as unknown as DocumentNode<PasswordResetDialog_UserFragment, unknown>;
export const RoleManagerDialog_UserFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RoleManagerDialog_user"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"roles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]} as unknown as DocumentNode<RoleManagerDialog_UserFragment, unknown>;
export const UserTable_ItemsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserTable_items"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"PasswordResetDialog_user"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"RoleManagerDialog_user"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PasswordResetDialog_user"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RoleManagerDialog_user"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"roles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]} as unknown as DocumentNode<UserTable_ItemsFragment, unknown>;
export const TodoListEditForm_OwnerOptionsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TodoListEditForm_ownerOptions"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]} as unknown as DocumentNode<TodoListEditForm_OwnerOptionsFragment, unknown>;
export const TodoListEditForm_DefaultValuesFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TodoListEditForm_defaultValues"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TodoList"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"ownerId"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"coverPhoto"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"filename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<TodoListEditForm_DefaultValuesFragment, unknown>;
export const TodoListTable_ItemsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TodoListTable_items"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TodoList"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"ownerId"}}]}}]} as unknown as DocumentNode<TodoListTable_ItemsFragment, unknown>;
export const FileInputCreateUploadUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"FileInputCreateUploadUrl"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreatePresignedUploadUrlInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createPresignedUploadUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"fields"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"method"}},{"kind":"Field","name":{"kind":"Name","value":"file"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"filename"}},{"kind":"Field","name":{"kind":"Name","value":"publicUrl"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"FileInput_value"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FileInput_value"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"File"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"filename"}},{"kind":"Field","name":{"kind":"Name","value":"publicUrl"}}]}}]} as unknown as DocumentNode<FileInputCreateUploadUrlMutation, FileInputCreateUploadUrlMutationVariables>;
export const UserEditPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UserEditPage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Uuid"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserEditForm_defaultValues"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserEditForm_defaultValues"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"customer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"stripeCustomerId"}}]}}]}}]} as unknown as DocumentNode<UserEditPageQuery, UserEditPageQueryVariables>;
export const UserEditPageUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UserEditPageUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserEditForm_defaultValues"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserEditForm_defaultValues"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"customer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"stripeCustomerId"}}]}}]}}]} as unknown as DocumentNode<UserEditPageUpdateMutation, UserEditPageUpdateMutationVariables>;
export const ResetUserPasswordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ResetUserPassword"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ResetUserPasswordInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resetUserPassword"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PasswordResetDialog_user"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PasswordResetDialog_user"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]} as unknown as DocumentNode<ResetUserPasswordMutation, ResetUserPasswordMutationVariables>;
export const UpdateUserRolesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateUserRoles"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateUserRolesInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUserRoles"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RoleManagerDialog_user"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RoleManagerDialog_user"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"roles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]} as unknown as DocumentNode<UpdateUserRolesMutation, UpdateUserRolesMutationVariables>;
export const UserListPageDeleteUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UserListPageDeleteUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<UserListPageDeleteUserMutation, UserListPageDeleteUserMutationVariables>;
export const UserListPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UserListPage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserTable_items"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PasswordResetDialog_user"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RoleManagerDialog_user"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"roles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserTable_items"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"PasswordResetDialog_user"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"RoleManagerDialog_user"}}]}}]} as unknown as DocumentNode<UserListPageQuery, UserListPageQueryVariables>;
export const HomePageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"HomePage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"viewer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]} as unknown as DocumentNode<HomePageQuery, HomePageQueryVariables>;
export const TodoListEditPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TodoListEditPage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Uuid"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"todoList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TodoListEditForm_defaultValues"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TodoListEditForm_defaultValues"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TodoList"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"ownerId"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"coverPhoto"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"filename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<TodoListEditPageQuery, TodoListEditPageQueryVariables>;
export const TodoListEditPageUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TodoListEditPageUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateTodoListInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTodoList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"todoList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TodoListEditForm_defaultValues"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TodoListEditForm_defaultValues"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TodoList"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"ownerId"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"coverPhoto"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"filename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<TodoListEditPageUpdateMutation, TodoListEditPageUpdateMutationVariables>;
export const TodoListEditFormOwnerOptionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TodoListEditFormOwnerOptions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TodoListEditForm_ownerOptions"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TodoListEditForm_ownerOptions"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]} as unknown as DocumentNode<TodoListEditFormOwnerOptionsQuery, TodoListEditFormOwnerOptionsQueryVariables>;
export const TodoListListPageDeleteTodoListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TodoListListPageDeleteTodoList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteTodoListInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteTodoList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"todoList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<TodoListListPageDeleteTodoListMutation, TodoListListPageDeleteTodoListMutationVariables>;
export const TodoListListPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TodoListListPage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"todoLists"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TodoListTable_items"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TodoListTable_items"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TodoList"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"ownerId"}}]}}]} as unknown as DocumentNode<TodoListListPageQuery, TodoListListPageQueryVariables>;
export const TodoListCreatePageCreateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TodoListCreatePageCreate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTodoListInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTodoList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"todoList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<TodoListCreatePageCreateMutation, TodoListCreatePageCreateMutationVariables>;