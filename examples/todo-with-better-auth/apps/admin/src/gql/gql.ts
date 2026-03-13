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
    "\n  fragment FileInput_value on File @_unmask {\n    id\n    filename\n    publicUrl\n  }\n": typeof types.FileInput_ValueFragmentDoc,
    "\n    mutation FileInputCreateUploadUrl($input: CreatePresignedUploadUrlInput!) {\n      createPresignedUploadUrl(input: $input) {\n        url\n        fields {\n          name\n          value\n        }\n        method\n        file {\n          id\n          filename\n          publicUrl\n          ...FileInput_value\n        }\n      }\n    }\n  ": typeof types.FileInputCreateUploadUrlDocument,
    "\n  query UserEditPage($id: Uuid!) {\n    user(id: $id) {\n      id\n      name\n      ...UserEditForm_defaultValues\n    }\n  }\n": typeof types.UserEditPageDocument,
    "\n  mutation UserEditPageUpdate($input: UpdateUserInput!) {\n    updateUser(input: $input) {\n      user {\n        id\n        name\n        ...UserEditForm_defaultValues\n      }\n    }\n  }\n": typeof types.UserEditPageUpdateDocument,
    "\n  fragment UserEditForm_defaultValues on User {\n    email\n    id\n    name\n    customer {\n      id\n      stripeCustomerId\n    }\n    roles {\n      role\n      userId\n    }\n  }\n": typeof types.UserEditForm_DefaultValuesFragmentDoc,
    "\n  mutation UserListPageDeleteUser($input: DeleteUserInput!) {\n    deleteUser(input: $input) {\n      user {\n        id\n        name\n      }\n    }\n  }\n": typeof types.UserListPageDeleteUserDocument,
    "\n  fragment UserTable_items on User {\n    email\n    id\n    name\n  }\n": typeof types.UserTable_ItemsFragmentDoc,
    "\n  query UserListPage {\n    users {\n      ...UserTable_items\n    }\n  }\n": typeof types.UserListPageDocument,
    "\n  query HomePage {\n    viewer {\n      id\n      email\n    }\n  }\n": typeof types.HomePageDocument,
    "\n  query TodoListEditPage($id: Uuid!) {\n    todoList(id: $id) {\n      id\n      name\n      ...TodoListEditForm_defaultValues\n    }\n  }\n": typeof types.TodoListEditPageDocument,
    "\n  mutation TodoListEditPageUpdate($input: UpdateTodoListInput!) {\n    updateTodoList(input: $input) {\n      todoList {\n        id\n        name\n        ...TodoListEditForm_defaultValues\n      }\n    }\n  }\n": typeof types.TodoListEditPageUpdateDocument,
    "\n  fragment TodoListEditForm_ownerOptions on User {\n    id\n    name\n  }\n": typeof types.TodoListEditForm_OwnerOptionsFragmentDoc,
    "\n  query TodoListEditFormOwnerOptions {\n    users {\n      ...TodoListEditForm_ownerOptions\n    }\n  }\n": typeof types.TodoListEditFormOwnerOptionsDocument,
    "\n  fragment TodoListEditForm_defaultValues on TodoList {\n    createdAt\n    id\n    name\n    ownerId\n    position\n    status\n    coverPhoto {\n      filename\n      id\n    }\n  }\n": typeof types.TodoListEditForm_DefaultValuesFragmentDoc,
    "\n  mutation TodoListListPageDeleteTodoList($input: DeleteTodoListInput!) {\n    deleteTodoList(input: $input) {\n      todoList {\n        id\n        name\n      }\n    }\n  }\n": typeof types.TodoListListPageDeleteTodoListDocument,
    "\n  fragment TodoListTable_items on TodoList {\n    createdAt\n    id\n    name\n    ownerId\n  }\n": typeof types.TodoListTable_ItemsFragmentDoc,
    "\n  query TodoListListPage {\n    todoLists {\n      ...TodoListTable_items\n    }\n  }\n": typeof types.TodoListListPageDocument,
    "\n  mutation TodoListCreatePageCreate($input: CreateTodoListInput!) {\n    createTodoList(input: $input) {\n      todoList {\n        id\n      }\n    }\n  }\n": typeof types.TodoListCreatePageCreateDocument,
};
const documents: Documents = {
    "\n  fragment FileInput_value on File @_unmask {\n    id\n    filename\n    publicUrl\n  }\n": types.FileInput_ValueFragmentDoc,
    "\n    mutation FileInputCreateUploadUrl($input: CreatePresignedUploadUrlInput!) {\n      createPresignedUploadUrl(input: $input) {\n        url\n        fields {\n          name\n          value\n        }\n        method\n        file {\n          id\n          filename\n          publicUrl\n          ...FileInput_value\n        }\n      }\n    }\n  ": types.FileInputCreateUploadUrlDocument,
    "\n  query UserEditPage($id: Uuid!) {\n    user(id: $id) {\n      id\n      name\n      ...UserEditForm_defaultValues\n    }\n  }\n": types.UserEditPageDocument,
    "\n  mutation UserEditPageUpdate($input: UpdateUserInput!) {\n    updateUser(input: $input) {\n      user {\n        id\n        name\n        ...UserEditForm_defaultValues\n      }\n    }\n  }\n": types.UserEditPageUpdateDocument,
    "\n  fragment UserEditForm_defaultValues on User {\n    email\n    id\n    name\n    customer {\n      id\n      stripeCustomerId\n    }\n    roles {\n      role\n      userId\n    }\n  }\n": types.UserEditForm_DefaultValuesFragmentDoc,
    "\n  mutation UserListPageDeleteUser($input: DeleteUserInput!) {\n    deleteUser(input: $input) {\n      user {\n        id\n        name\n      }\n    }\n  }\n": types.UserListPageDeleteUserDocument,
    "\n  fragment UserTable_items on User {\n    email\n    id\n    name\n  }\n": types.UserTable_ItemsFragmentDoc,
    "\n  query UserListPage {\n    users {\n      ...UserTable_items\n    }\n  }\n": types.UserListPageDocument,
    "\n  query HomePage {\n    viewer {\n      id\n      email\n    }\n  }\n": types.HomePageDocument,
    "\n  query TodoListEditPage($id: Uuid!) {\n    todoList(id: $id) {\n      id\n      name\n      ...TodoListEditForm_defaultValues\n    }\n  }\n": types.TodoListEditPageDocument,
    "\n  mutation TodoListEditPageUpdate($input: UpdateTodoListInput!) {\n    updateTodoList(input: $input) {\n      todoList {\n        id\n        name\n        ...TodoListEditForm_defaultValues\n      }\n    }\n  }\n": types.TodoListEditPageUpdateDocument,
    "\n  fragment TodoListEditForm_ownerOptions on User {\n    id\n    name\n  }\n": types.TodoListEditForm_OwnerOptionsFragmentDoc,
    "\n  query TodoListEditFormOwnerOptions {\n    users {\n      ...TodoListEditForm_ownerOptions\n    }\n  }\n": types.TodoListEditFormOwnerOptionsDocument,
    "\n  fragment TodoListEditForm_defaultValues on TodoList {\n    createdAt\n    id\n    name\n    ownerId\n    position\n    status\n    coverPhoto {\n      filename\n      id\n    }\n  }\n": types.TodoListEditForm_DefaultValuesFragmentDoc,
    "\n  mutation TodoListListPageDeleteTodoList($input: DeleteTodoListInput!) {\n    deleteTodoList(input: $input) {\n      todoList {\n        id\n        name\n      }\n    }\n  }\n": types.TodoListListPageDeleteTodoListDocument,
    "\n  fragment TodoListTable_items on TodoList {\n    createdAt\n    id\n    name\n    ownerId\n  }\n": types.TodoListTable_ItemsFragmentDoc,
    "\n  query TodoListListPage {\n    todoLists {\n      ...TodoListTable_items\n    }\n  }\n": types.TodoListListPageDocument,
    "\n  mutation TodoListCreatePageCreate($input: CreateTodoListInput!) {\n    createTodoList(input: $input) {\n      todoList {\n        id\n      }\n    }\n  }\n": types.TodoListCreatePageCreateDocument,
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
export function graphql(source: "\n  fragment FileInput_value on File @_unmask {\n    id\n    filename\n    publicUrl\n  }\n"): (typeof documents)["\n  fragment FileInput_value on File @_unmask {\n    id\n    filename\n    publicUrl\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    mutation FileInputCreateUploadUrl($input: CreatePresignedUploadUrlInput!) {\n      createPresignedUploadUrl(input: $input) {\n        url\n        fields {\n          name\n          value\n        }\n        method\n        file {\n          id\n          filename\n          publicUrl\n          ...FileInput_value\n        }\n      }\n    }\n  "): (typeof documents)["\n    mutation FileInputCreateUploadUrl($input: CreatePresignedUploadUrlInput!) {\n      createPresignedUploadUrl(input: $input) {\n        url\n        fields {\n          name\n          value\n        }\n        method\n        file {\n          id\n          filename\n          publicUrl\n          ...FileInput_value\n        }\n      }\n    }\n  "];
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
export function graphql(source: "\n  fragment UserEditForm_defaultValues on User {\n    email\n    id\n    name\n    customer {\n      id\n      stripeCustomerId\n    }\n    roles {\n      role\n      userId\n    }\n  }\n"): (typeof documents)["\n  fragment UserEditForm_defaultValues on User {\n    email\n    id\n    name\n    customer {\n      id\n      stripeCustomerId\n    }\n    roles {\n      role\n      userId\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UserListPageDeleteUser($input: DeleteUserInput!) {\n    deleteUser(input: $input) {\n      user {\n        id\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation UserListPageDeleteUser($input: DeleteUserInput!) {\n    deleteUser(input: $input) {\n      user {\n        id\n        name\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment UserTable_items on User {\n    email\n    id\n    name\n  }\n"): (typeof documents)["\n  fragment UserTable_items on User {\n    email\n    id\n    name\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query UserListPage {\n    users {\n      ...UserTable_items\n    }\n  }\n"): (typeof documents)["\n  query UserListPage {\n    users {\n      ...UserTable_items\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query HomePage {\n    viewer {\n      id\n      email\n    }\n  }\n"): (typeof documents)["\n  query HomePage {\n    viewer {\n      id\n      email\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query TodoListEditPage($id: Uuid!) {\n    todoList(id: $id) {\n      id\n      name\n      ...TodoListEditForm_defaultValues\n    }\n  }\n"): (typeof documents)["\n  query TodoListEditPage($id: Uuid!) {\n    todoList(id: $id) {\n      id\n      name\n      ...TodoListEditForm_defaultValues\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation TodoListEditPageUpdate($input: UpdateTodoListInput!) {\n    updateTodoList(input: $input) {\n      todoList {\n        id\n        name\n        ...TodoListEditForm_defaultValues\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation TodoListEditPageUpdate($input: UpdateTodoListInput!) {\n    updateTodoList(input: $input) {\n      todoList {\n        id\n        name\n        ...TodoListEditForm_defaultValues\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment TodoListEditForm_ownerOptions on User {\n    id\n    name\n  }\n"): (typeof documents)["\n  fragment TodoListEditForm_ownerOptions on User {\n    id\n    name\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query TodoListEditFormOwnerOptions {\n    users {\n      ...TodoListEditForm_ownerOptions\n    }\n  }\n"): (typeof documents)["\n  query TodoListEditFormOwnerOptions {\n    users {\n      ...TodoListEditForm_ownerOptions\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment TodoListEditForm_defaultValues on TodoList {\n    createdAt\n    id\n    name\n    ownerId\n    position\n    status\n    coverPhoto {\n      filename\n      id\n    }\n  }\n"): (typeof documents)["\n  fragment TodoListEditForm_defaultValues on TodoList {\n    createdAt\n    id\n    name\n    ownerId\n    position\n    status\n    coverPhoto {\n      filename\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation TodoListListPageDeleteTodoList($input: DeleteTodoListInput!) {\n    deleteTodoList(input: $input) {\n      todoList {\n        id\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation TodoListListPageDeleteTodoList($input: DeleteTodoListInput!) {\n    deleteTodoList(input: $input) {\n      todoList {\n        id\n        name\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment TodoListTable_items on TodoList {\n    createdAt\n    id\n    name\n    ownerId\n  }\n"): (typeof documents)["\n  fragment TodoListTable_items on TodoList {\n    createdAt\n    id\n    name\n    ownerId\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query TodoListListPage {\n    todoLists {\n      ...TodoListTable_items\n    }\n  }\n"): (typeof documents)["\n  query TodoListListPage {\n    todoLists {\n      ...TodoListTable_items\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation TodoListCreatePageCreate($input: CreateTodoListInput!) {\n    createTodoList(input: $input) {\n      todoList {\n        id\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation TodoListCreatePageCreate($input: CreateTodoListInput!) {\n    createTodoList(input: $input) {\n      todoList {\n        id\n      }\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;