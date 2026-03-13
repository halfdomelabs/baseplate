import { createTestTsImportMap } from '@baseplate-dev/core-generators/test-helpers';
import { describe, expect, it } from 'vitest';

import { graphqlImportsSchema } from '#src/generators/apollo/react-apollo/providers/graphql-imports.js';

import type { GraphQLFragment, GraphQLOperation } from './graphql.js';

import {
  renderGraphQLFragment,
  renderGraphQLOperation,
} from './graphql-render.js';

const graphqlImports = createTestTsImportMap(
  graphqlImportsSchema,
  'graphql-imports',
);

// ============================================================================
// renderGraphQLFragment tests
// ============================================================================

describe('renderGraphQLFragment', () => {
  it('renders a fragment with no dependencies', () => {
    const fragment: GraphQLFragment = {
      variableName: 'userRowFragment',
      fragmentName: 'UserTable_items',
      onType: 'User',
      fields: [{ name: 'id' }, { name: 'email' }, { name: 'name' }],
      path: './user-table.tsx',
    };

    const result = renderGraphQLFragment(fragment, {
      currentPath: './user-table.tsx',
      exported: true,
      graphqlImports,
    });

    expect(result).toMatchInlineSnapshot(`
      import { graphql } from 'graphql-imports/graphql';

      export const userRowFragment = graphql(\`
      fragment UserTable_items on User {
        email
        id
        name
      }
      \`);
    `);
  });

  it('renders a fragment with spread dependencies', () => {
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

    const result = renderGraphQLFragment(fragment, {
      currentPath: './user-table.tsx',
      exported: true,
      graphqlImports,
    });

    expect(result).toMatchInlineSnapshot(`
      import { graphql } from 'graphql-imports/graphql';

      export const userRowFragment = graphql(\`
      fragment UserTable_items on User {
        id
        ...RoleManagerDialog_user
      }
      \`);
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

    const result = renderGraphQLFragment(fragment, {
      currentPath: './user.tsx',
      exported: false,
      graphqlImports,
    });

    expect(result).toMatchInlineSnapshot(`
      import { graphql } from 'graphql-imports/graphql';

      const internalFragment = graphql(\`
      fragment Internal on User {
        id
      }
      \`);
    `);
  });

  it('imports graphql from the import map provider', () => {
    const fragment: GraphQLFragment = {
      variableName: 'userFragment',
      fragmentName: 'User',
      onType: 'User',
      fields: [{ name: 'id' }],
      path: './user.tsx',
    };

    const result = renderGraphQLFragment(fragment, {
      currentPath: './user.tsx',
      graphqlImports,
    });

    expect(result).toMatchInlineSnapshot(`
      import { graphql } from 'graphql-imports/graphql';

      export const userFragment = graphql(\`
      fragment User on User {
        id
      }
      \`);
    `);
  });
});

// ============================================================================
// renderGraphQLOperation tests
// ============================================================================

describe('renderGraphQLOperation', () => {
  it('renders a simple query with no fragment dependencies', () => {
    const operation: GraphQLOperation = {
      type: 'query',
      variableName: 'usersQuery',
      operationName: 'Users',
      fields: [{ name: 'users', fields: [{ name: 'id' }, { name: 'name' }] }],
    };

    const result = renderGraphQLOperation(operation, {
      currentPath: './queries.ts',
      exported: true,
      graphqlImports,
    });

    expect(result).toMatchInlineSnapshot(`
      import { graphql } from 'graphql-imports/graphql';

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

  it('renders a query with fragment spread', () => {
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

    const result = renderGraphQLOperation(operation, {
      currentPath: './queries.ts',
      exported: true,
      graphqlImports,
    });

    expect(result).toMatchInlineSnapshot(`
      import { graphql } from 'graphql-imports/graphql';

      export const usersQuery = graphql(\`
      query Users {
        users {
          ...UserTable_items
        }
      }
      \`);
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

    const result = renderGraphQLOperation(operation, {
      currentPath: './edit.tsx',
      exported: false,
      graphqlImports,
    });

    expect(result).toMatchInlineSnapshot(`
      import { graphql } from 'graphql-imports/graphql';

      const updateUserMutation = graphql(\`
      mutation UpdateUser($input: UpdateUserInput!) {
        updateUser(input: $input) {
          user {
            ...UserEdit
          }
        }
      }
      \`);
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

    const result = renderGraphQLOperation(operation, {
      currentPath: './edit.tsx',
      exported: true,
      graphqlImports,
    });

    expect(result).toMatchInlineSnapshot(`
      import { graphql } from 'graphql-imports/graphql';

      export const userEditByIdQuery = graphql(\`
      query UserEditById($id: Uuid!) {
        user(id: $id) {
          ...UserEdit
        }
      }
      \`);
    `);
  });
});
