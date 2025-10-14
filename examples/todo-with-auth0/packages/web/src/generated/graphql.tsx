import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
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
  JSON: { input: any; output: any; }
  /** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSONObject: { input: any; output: any; }
  /** A field whose value is a generic Universally Unique Identifier: https://en.wikipedia.org/wiki/Universally_unique_identifier. */
  Uuid: { input: string; output: string; }
};

/** Payload type for createBullBoardAuthCode mutation */
export type CreateBullBoardAuthCodePayload = {
  __typename?: 'CreateBullBoardAuthCodePayload';
  code: Scalars['String']['output'];
};

/** Input type for createPresignedDownloadUrl mutation */
export type CreatePresignedDownloadUrlInput = {
  fileId: Scalars['Uuid']['input'];
};

/** Payload type for createPresignedDownloadUrl mutation */
export type CreatePresignedDownloadUrlPayload = {
  __typename?: 'CreatePresignedDownloadUrlPayload';
  url: Scalars['String']['output'];
};

/** Input type for createPresignedUploadUrl mutation */
export type CreatePresignedUploadUrlInput = {
  category: FileCategory;
  contentType: Scalars['String']['input'];
  filename: Scalars['String']['input'];
  size: Scalars['Int']['input'];
};

/** Payload type for createPresignedUploadUrl mutation */
export type CreatePresignedUploadUrlPayload = {
  __typename?: 'CreatePresignedUploadUrlPayload';
  fields?: Maybe<Array<PresignedUrlField>>;
  file: File;
  method: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

/** Input type for createTodoItem mutation */
export type CreateTodoItemInput = {
  data: TodoItemCreateData;
};

/** Payload type for createTodoItem mutation */
export type CreateTodoItemPayload = {
  __typename?: 'CreateTodoItemPayload';
  todoItem: TodoItem;
};

/** Input type for createTodoList mutation */
export type CreateTodoListInput = {
  data: TodoListCreateData;
};

/** Payload type for createTodoList mutation */
export type CreateTodoListPayload = {
  __typename?: 'CreateTodoListPayload';
  todoList: TodoList;
};

/** Input type for createTodoListShare mutation */
export type CreateTodoListShareInput = {
  data: TodoListShareCreateData;
};

/** Payload type for createTodoListShare mutation */
export type CreateTodoListSharePayload = {
  __typename?: 'CreateTodoListSharePayload';
  todoListShare: TodoListShare;
};

/** Input type for createUser mutation */
export type CreateUserInput = {
  data: UserCreateData;
};

/** Payload type for createUser mutation */
export type CreateUserPayload = {
  __typename?: 'CreateUserPayload';
  user: User;
};

export type Customer = {
  __typename?: 'Customer';
  id: Scalars['ID']['output'];
  stripeCustomerId: Scalars['String']['output'];
  user: User;
};

/** Input type for deleteTodoItem mutation */
export type DeleteTodoItemInput = {
  id: Scalars['Uuid']['input'];
};

/** Payload type for deleteTodoItem mutation */
export type DeleteTodoItemPayload = {
  __typename?: 'DeleteTodoItemPayload';
  todoItem: TodoItem;
};

/** Input type for deleteTodoList mutation */
export type DeleteTodoListInput = {
  id: Scalars['Uuid']['input'];
};

/** Payload type for deleteTodoList mutation */
export type DeleteTodoListPayload = {
  __typename?: 'DeleteTodoListPayload';
  todoList: TodoList;
};

/** Input type for deleteTodoListShare mutation */
export type DeleteTodoListShareInput = {
  id: TodoListSharePrimaryKey;
};

/** Payload type for deleteTodoListShare mutation */
export type DeleteTodoListSharePayload = {
  __typename?: 'DeleteTodoListSharePayload';
  todoListShare: TodoListShare;
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

export type File = {
  __typename?: 'File';
  category: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  filename: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  mimeType: Scalars['String']['output'];
  /** URL of the file where it is publicly hosted. Returns null if it is not publicly available. */
  publicUrl?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  uploader?: Maybe<User>;
};

export type FileCategory =
  | 'TODO_LIST_COVER_PHOTO'
  | 'USER_IMAGE_FILE'
  | 'USER_PROFILE_AVATAR';

/** Input representing an uploaded file */
export type FileInput = {
  id: Scalars['Uuid']['input'];
  /** Discarded but useful for forms */
  name?: InputMaybe<Scalars['String']['input']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  createBullBoardAuthCode: CreateBullBoardAuthCodePayload;
  createPresignedDownloadUrl: CreatePresignedDownloadUrlPayload;
  createPresignedUploadUrl: CreatePresignedUploadUrlPayload;
  createTodoItem: CreateTodoItemPayload;
  createTodoList: CreateTodoListPayload;
  createTodoListShare: CreateTodoListSharePayload;
  createUser: CreateUserPayload;
  deleteTodoItem: DeleteTodoItemPayload;
  deleteTodoList: DeleteTodoListPayload;
  deleteTodoListShare: DeleteTodoListSharePayload;
  deleteUser: DeleteUserPayload;
  updateTodoItem: UpdateTodoItemPayload;
  updateTodoList: UpdateTodoListPayload;
  updateTodoListShare: UpdateTodoListSharePayload;
  updateUser: UpdateUserPayload;
};


export type MutationCreatePresignedDownloadUrlArgs = {
  input: CreatePresignedDownloadUrlInput;
};


export type MutationCreatePresignedUploadUrlArgs = {
  input: CreatePresignedUploadUrlInput;
};


export type MutationCreateTodoItemArgs = {
  input: CreateTodoItemInput;
};


export type MutationCreateTodoListArgs = {
  input: CreateTodoListInput;
};


export type MutationCreateTodoListShareArgs = {
  input: CreateTodoListShareInput;
};


export type MutationCreateUserArgs = {
  input: CreateUserInput;
};


export type MutationDeleteTodoItemArgs = {
  input: DeleteTodoItemInput;
};


export type MutationDeleteTodoListArgs = {
  input: DeleteTodoListInput;
};


export type MutationDeleteTodoListShareArgs = {
  input: DeleteTodoListShareInput;
};


export type MutationDeleteUserArgs = {
  input: DeleteUserInput;
};


export type MutationUpdateTodoItemArgs = {
  input: UpdateTodoItemInput;
};


export type MutationUpdateTodoListArgs = {
  input: UpdateTodoListInput;
};


export type MutationUpdateTodoListShareArgs = {
  input: UpdateTodoListShareInput;
};


export type MutationUpdateUserArgs = {
  input: UpdateUserInput;
};

export type PresignedUrlField = {
  __typename?: 'PresignedUrlField';
  name: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  file: File;
  files: Array<File>;
  todoItem: TodoItem;
  todoItems: Array<TodoItem>;
  todoList: TodoList;
  todoListShare: TodoListShare;
  todoListShares: Array<TodoListShare>;
  todoLists: Array<TodoList>;
  user: User;
  users: Array<User>;
};


export type QueryFileArgs = {
  id: Scalars['Uuid']['input'];
};


export type QueryTodoItemArgs = {
  id: Scalars['Uuid']['input'];
};


export type QueryTodoListArgs = {
  id: Scalars['Uuid']['input'];
};


export type QueryTodoListShareArgs = {
  id: TodoListSharePrimaryKey;
};


export type QueryUserArgs = {
  id: Scalars['Uuid']['input'];
};

export type TodoItem = {
  __typename?: 'TodoItem';
  attachments: Array<TodoItemAttachment>;
  createdAt: Scalars['DateTime']['output'];
  done: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  position: Scalars['Int']['output'];
  text: Scalars['String']['output'];
  todoList: TodoList;
  todoListId: Scalars['Uuid']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type TodoItemAttachment = {
  __typename?: 'TodoItemAttachment';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  position: Scalars['Int']['output'];
  tags: Array<TodoItemAttachmentTag>;
  todoItem: TodoItem;
  todoItemId: Scalars['Uuid']['output'];
  updatedAt: Scalars['DateTime']['output'];
  url: Scalars['String']['output'];
};

export type TodoItemAttachmentEmbeddedTagsData = {
  tag: Scalars['String']['input'];
};

export type TodoItemAttachmentTag = {
  __typename?: 'TodoItemAttachmentTag';
  tag: Scalars['String']['output'];
  todoItemAttachment: TodoItemAttachment;
  todoItemAttachmentId: Scalars['Uuid']['output'];
};

export type TodoItemCreateData = {
  assigneeId?: InputMaybe<Scalars['Uuid']['input']>;
  attachments?: InputMaybe<Array<TodoItemEmbeddedAttachmentsData>>;
  done: Scalars['Boolean']['input'];
  position: Scalars['Int']['input'];
  text: Scalars['String']['input'];
  todoListId: Scalars['Uuid']['input'];
};

export type TodoItemEmbeddedAttachmentsData = {
  id?: InputMaybe<Scalars['Uuid']['input']>;
  position: Scalars['Int']['input'];
  tags?: InputMaybe<Array<TodoItemAttachmentEmbeddedTagsData>>;
  url: Scalars['String']['input'];
};

export type TodoItemUpdateData = {
  assigneeId?: InputMaybe<Scalars['Uuid']['input']>;
  attachments?: InputMaybe<Array<TodoItemEmbeddedAttachmentsData>>;
  done?: InputMaybe<Scalars['Boolean']['input']>;
  position?: InputMaybe<Scalars['Int']['input']>;
  text?: InputMaybe<Scalars['String']['input']>;
  todoListId?: InputMaybe<Scalars['Uuid']['input']>;
};

export type TodoList = {
  __typename?: 'TodoList';
  coverPhoto?: Maybe<File>;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  owner: User;
  ownerId: Scalars['Uuid']['output'];
  position: Scalars['Int']['output'];
  status?: Maybe<TodoListStatus>;
  updatedAt: Scalars['DateTime']['output'];
};

export type TodoListCreateData = {
  coverPhoto?: InputMaybe<FileInput>;
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  name: Scalars['String']['input'];
  ownerId: Scalars['Uuid']['input'];
  position: Scalars['Int']['input'];
  status?: InputMaybe<TodoListStatus>;
};

export type TodoListShare = {
  __typename?: 'TodoListShare';
  createdAt: Scalars['DateTime']['output'];
  todoList: TodoList;
  todoListId: Scalars['Uuid']['output'];
  updatedAt: Scalars['DateTime']['output'];
  user: User;
  userId: Scalars['Uuid']['output'];
};

export type TodoListShareCreateData = {
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  todoListId: Scalars['Uuid']['input'];
  updatedAt?: InputMaybe<Scalars['DateTime']['input']>;
  userId: Scalars['Uuid']['input'];
};

export type TodoListSharePrimaryKey = {
  todoListId: Scalars['Uuid']['input'];
  userId: Scalars['Uuid']['input'];
};

export type TodoListShareUpdateData = {
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  todoListId?: InputMaybe<Scalars['Uuid']['input']>;
  updatedAt?: InputMaybe<Scalars['DateTime']['input']>;
  userId?: InputMaybe<Scalars['Uuid']['input']>;
};

export type TodoListStatus =
  | 'ACTIVE'
  | 'INACTIVE';

export type TodoListUpdateData = {
  coverPhoto?: InputMaybe<FileInput>;
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  ownerId?: InputMaybe<Scalars['Uuid']['input']>;
  position?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<TodoListStatus>;
};

/** Input type for updateTodoItem mutation */
export type UpdateTodoItemInput = {
  data: TodoItemUpdateData;
  id: Scalars['Uuid']['input'];
};

/** Payload type for updateTodoItem mutation */
export type UpdateTodoItemPayload = {
  __typename?: 'UpdateTodoItemPayload';
  todoItem: TodoItem;
};

/** Input type for updateTodoList mutation */
export type UpdateTodoListInput = {
  data: TodoListUpdateData;
  id: Scalars['Uuid']['input'];
};

/** Payload type for updateTodoList mutation */
export type UpdateTodoListPayload = {
  __typename?: 'UpdateTodoListPayload';
  todoList: TodoList;
};

/** Input type for updateTodoListShare mutation */
export type UpdateTodoListShareInput = {
  data: TodoListShareUpdateData;
  id: TodoListSharePrimaryKey;
};

/** Payload type for updateTodoListShare mutation */
export type UpdateTodoListSharePayload = {
  __typename?: 'UpdateTodoListSharePayload';
  todoListShare: TodoListShare;
};

/** Input type for updateUser mutation */
export type UpdateUserInput = {
  data: UserUpdateData;
  id: Scalars['Uuid']['input'];
};

/** Payload type for updateUser mutation */
export type UpdateUserPayload = {
  __typename?: 'UpdateUserPayload';
  user: User;
};

export type User = {
  __typename?: 'User';
  createdAt: Scalars['DateTime']['output'];
  customer?: Maybe<Customer>;
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name?: Maybe<Scalars['String']['output']>;
  roles: Array<UserRole>;
  todoLists: Array<TodoList>;
  updatedAt: Scalars['DateTime']['output'];
  userProfile?: Maybe<UserProfile>;
};

export type UserCreateData = {
  customer?: InputMaybe<UserEmbeddedCustomerData>;
  email: Scalars['String']['input'];
  images?: InputMaybe<Array<UserEmbeddedImagesData>>;
  name?: InputMaybe<Scalars['String']['input']>;
  roles?: InputMaybe<Array<UserEmbeddedRolesData>>;
  userProfile?: InputMaybe<UserEmbeddedUserProfileData>;
};

export type UserEmbeddedCustomerData = {
  stripeCustomerId: Scalars['String']['input'];
};

export type UserEmbeddedImagesData = {
  caption: Scalars['String']['input'];
  file: FileInput;
  id?: InputMaybe<Scalars['Uuid']['input']>;
};

export type UserEmbeddedRolesData = {
  role: Scalars['String']['input'];
};

export type UserEmbeddedUserProfileData = {
  avatar?: InputMaybe<FileInput>;
  bio?: InputMaybe<Scalars['String']['input']>;
  birthDay?: InputMaybe<Scalars['Date']['input']>;
  id?: InputMaybe<Scalars['Uuid']['input']>;
};

export type UserImage = {
  __typename?: 'UserImage';
  file: File;
  fileId: Scalars['Uuid']['output'];
  id: Scalars['ID']['output'];
  userId: Scalars['Uuid']['output'];
};

export type UserProfile = {
  __typename?: 'UserProfile';
  avatar?: Maybe<File>;
  avatarId?: Maybe<Scalars['Uuid']['output']>;
  bio?: Maybe<Scalars['String']['output']>;
  birthDay?: Maybe<Scalars['Date']['output']>;
  id: Scalars['ID']['output'];
  twitterHandle?: Maybe<Scalars['String']['output']>;
  user: User;
  userId: Scalars['Uuid']['output'];
};

export type UserRole = {
  __typename?: 'UserRole';
  createdAt: Scalars['DateTime']['output'];
  role: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  user: User;
  userId: Scalars['Uuid']['output'];
};

export type UserUpdateData = {
  customer?: InputMaybe<UserEmbeddedCustomerData>;
  email?: InputMaybe<Scalars['String']['input']>;
  images?: InputMaybe<Array<UserEmbeddedImagesData>>;
  name?: InputMaybe<Scalars['String']['input']>;
  roles?: InputMaybe<Array<UserEmbeddedRolesData>>;
  userProfile?: InputMaybe<UserEmbeddedUserProfileData>;
};

export type CurrentUserFragment = { __typename?: 'User', id: string, email: string };

export type GetUserByIdQueryVariables = Exact<{
  id: Scalars['Uuid']['input'];
}>;


export type GetUserByIdQuery = { __typename?: 'Query', user: { __typename?: 'User', id: string, email: string } };

export const CurrentUserFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CurrentUser"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]} as unknown as DocumentNode<CurrentUserFragment, unknown>;
export const GetUserByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getUserById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Uuid"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CurrentUser"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CurrentUser"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]} as unknown as DocumentNode<GetUserByIdQuery, GetUserByIdQueryVariables>;