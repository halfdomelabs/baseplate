import { describe, expect, it } from 'vitest';

import type { GraphQLFragment, GraphQLOperation } from './graphql.js';

import { renderTadaFragment, renderTadaOperation } from './gql-tada.js';

// ============================================================================
// renderTadaFragment tests
// ============================================================================

describe('renderTadaFragment', () => {
  it('renders a fragment with no dependencies', () => {
    const fragment: GraphQLFragment = {
      variableName: 'userRowFragment',
      fragmentName: 'UserTable_items',
      onType: 'User',
      fields: [{ name: 'id' }, { name: 'email' }, { name: 'name' }],
      path: './user-table.tsx',
    };

    const result = renderTadaFragment(fragment, {
      currentPath: './user-table.tsx',
      exported: true,
    });

    expect(result).toMatchInlineSnapshot(`
      import { graphql } from '@src/graphql';

      export const userRowFragment = graphql(\`
      fragment UserTable_items on User {
        email
        id
        name
      }
      \`);
    `);
  });

  it('renders a fragment with dependencies from same file', () => {
    const nestedFragment: GraphQLFragment = {
      variableName: 'roleFragment',
      fragmentName: 'Role_fields',
      onType: 'Role',
      fields: [{ name: 'role' }],
      path: './user-table.tsx',
    };

    const fragment: GraphQLFragment = {
      variableName: 'userRowFragment',
      fragmentName: 'UserTable_items',
      onType: 'User',
      fields: [{ name: 'id' }, { type: 'spread', fragment: nestedFragment }],
      path: './user-table.tsx',
    };

    const result = renderTadaFragment(fragment, {
      currentPath: './user-table.tsx',
      exported: true,
    });

    expect(result).toMatchInlineSnapshot(`
      import { graphql } from '@src/graphql';

      export const userRowFragment = graphql(\`
      fragment UserTable_items on User {
        id
        ...Role_fields
      }
      \`, [roleFragment]);
    `);
  });

  it('renders a fragment with dependencies from different file', () => {
    const externalFragment: GraphQLFragment = {
      variableName: 'roleManagerDialogUserFragment',
      fragmentName: 'RoleManagerDialog_user',
      onType: 'User',
      fields: [{ name: 'roles', fields: [{ name: 'role' }] }],
      path: './role-manager-dialog.tsx',
    };

    const fragment: GraphQLFragment = {
      variableName: 'userRowFragment',
      fragmentName: 'UserTable_items',
      onType: 'User',
      fields: [{ name: 'id' }, { type: 'spread', fragment: externalFragment }],
      path: './user-table.tsx',
    };

    const result = renderTadaFragment(fragment, {
      currentPath: './user-table.tsx',
      exported: true,
    });

    expect(result).toMatchInlineSnapshot(`
      import { roleManagerDialogUserFragment } from './role-manager-dialog.tsx';
      import { graphql } from '@src/graphql';

      export const userRowFragment = graphql(\`
      fragment UserTable_items on User {
        id
        ...RoleManagerDialog_user
      }
      \`, [roleManagerDialogUserFragment]);
    `);
  });

  it('renders a non-exported fragment', () => {
    const fragment: GraphQLFragment = {
      variableName: 'internalFragment',
      fragmentName: 'Internal',
      onType: 'User',
      fields: [{ name: 'id' }],
      path: './user.tsx',
    };

    const result = renderTadaFragment(fragment, {
      currentPath: './user.tsx',
      exported: false,
    });

    expect(result).toMatchInlineSnapshot(`
      import { graphql } from '@src/graphql';

      const internalFragment = graphql(\`
      fragment Internal on User {
        id
      }
      \`);
    `);
  });

  it('imports graphql from @src/graphql', () => {
    const fragment: GraphQLFragment = {
      variableName: 'userFragment',
      fragmentName: 'User',
      onType: 'User',
      fields: [{ name: 'id' }],
      path: './user.tsx',
    };

    const result = renderTadaFragment(fragment, {
      currentPath: './user.tsx',
    });

    expect(result).toMatchInlineSnapshot(`
      import { graphql } from '@src/graphql';

      export const userFragment = graphql(\`
      fragment User on User {
        id
      }
      \`);
    `);
  });
});

// ============================================================================
// renderTadaOperation tests
// ============================================================================

describe('renderTadaOperation', () => {
  it('renders a simple query with no fragment dependencies', () => {
    const operation: GraphQLOperation = {
      type: 'query',
      variableName: 'usersQuery',
      operationName: 'Users',
      fields: [{ name: 'users', fields: [{ name: 'id' }, { name: 'name' }] }],
    };

    const result = renderTadaOperation(operation, {
      currentPath: './queries.ts',
      exported: true,
    });

    expect(result).toMatchInlineSnapshot(`
      import { graphql } from '@src/graphql';

      export const usersQuery = graphql(\`
      query Users {
        users {
          id
          name
        }
      }
      \`);
    `);
  });

  it('renders a query with fragment dependency', () => {
    const fragment: GraphQLFragment = {
      variableName: 'userRowFragment',
      fragmentName: 'UserTable_items',
      onType: 'User',
      fields: [{ name: 'id' }],
      path: './user-table.tsx',
    };

    const operation: GraphQLOperation = {
      type: 'query',
      variableName: 'usersQuery',
      operationName: 'Users',
      fields: [
        {
          name: 'users',
          fields: [{ type: 'spread', fragment }],
        },
      ],
    };

    const result = renderTadaOperation(operation, {
      currentPath: './queries.ts',
      exported: true,
    });

    expect(result).toMatchInlineSnapshot(`
      import { userRowFragment } from './user-table.tsx';
      import { graphql } from '@src/graphql';

      export const usersQuery = graphql(\`
      query Users {
        users {
          ...UserTable_items
        }
      }
      \`, [userRowFragment]);
    `);
  });

  it('renders a mutation with variables', () => {
    const fragment: GraphQLFragment = {
      variableName: 'userEditFragment',
      fragmentName: 'UserEdit',
      onType: 'User',
      fields: [{ name: 'id' }],
      path: './edit.tsx',
    };

    const operation: GraphQLOperation = {
      type: 'mutation',
      variableName: 'updateUserMutation',
      operationName: 'UpdateUser',
      variables: [{ name: 'input', type: 'UpdateUserInput!' }],
      fields: [
        {
          name: 'updateUser',
          args: [
            { name: 'input', value: { type: 'variable', variable: 'input' } },
          ],
          fields: [
            {
              name: 'user',
              fields: [{ type: 'spread', fragment }],
            },
          ],
        },
      ],
    };

    const result = renderTadaOperation(operation, {
      currentPath: './edit.tsx',
      exported: false,
    });

    expect(result).toMatchInlineSnapshot(`
      import { graphql } from '@src/graphql';

      const updateUserMutation = graphql(\`
      mutation UpdateUser($input: UpdateUserInput!) {
        updateUser(input: $input) {
          user {
            ...UserEdit
          }
        }
      }
      \`, [userEditFragment]);
    `);
  });

  it('renders a query with variables', () => {
    const fragment: GraphQLFragment = {
      variableName: 'userEditFragment',
      fragmentName: 'UserEdit',
      onType: 'User',
      fields: [{ name: 'id' }],
      path: './edit.tsx',
    };

    const operation: GraphQLOperation = {
      type: 'query',
      variableName: 'userEditByIdQuery',
      operationName: 'UserEditById',
      variables: [{ name: 'id', type: 'Uuid!' }],
      fields: [
        {
          name: 'user',
          args: [{ name: 'id', value: { type: 'variable', variable: 'id' } }],
          fields: [{ type: 'spread', fragment }],
        },
      ],
    };

    const result = renderTadaOperation(operation, {
      currentPath: './edit.tsx',
      exported: true,
    });

    expect(result).toMatchInlineSnapshot(`
      import { graphql } from '@src/graphql';

      export const userEditByIdQuery = graphql(\`
      query UserEditById($id: Uuid!) {
        user(id: $id) {
          ...UserEdit
        }
      }
      \`, [userEditFragment]);
    `);
  });
});
