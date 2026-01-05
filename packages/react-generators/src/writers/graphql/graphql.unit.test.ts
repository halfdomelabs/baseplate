import { describe, expect, it } from 'vitest';

import type {
  GraphQLField,
  GraphQLFragment,
  GraphQLOperation,
} from './graphql.js';

import {
  areFieldsIdentical,
  collectFragmentDependencies,
  isSimpleField,
  isSpreadField,
  mergeGraphqlFields,
  renderFields,
  renderFragment,
  renderOperation,
} from './graphql.js';

// ============================================================================
// renderFragment tests
// ============================================================================

describe('renderFragment', () => {
  it('renders a simple fragment', () => {
    const fragment: GraphQLFragment = {
      variableName: 'userRowFragment',
      fragmentName: 'UserRow',
      onType: 'User',
      fields: [{ name: 'id' }, { name: 'email' }, { name: 'name' }],
      path: './user.tsx',
    };

    const result = renderFragment(fragment);

    expect(result).toBe(`fragment UserRow on User {
  email
  id
  name
}`);
  });

  it('renders a fragment with nested fields', () => {
    const fragment: GraphQLFragment = {
      variableName: 'userRowFragment',
      fragmentName: 'UserRow',
      onType: 'User',
      fields: [
        { name: 'id' },
        { name: 'roles', fields: [{ name: 'role' }, { name: 'createdAt' }] },
      ],
      path: './user.tsx',
    };

    const result = renderFragment(fragment);

    expect(result).toBe(`fragment UserRow on User {
  id
  roles {
    createdAt
    role
  }
}`);
  });

  it('renders a fragment with spread fields', () => {
    const nestedFragment: GraphQLFragment = {
      variableName: 'roleFragment',
      fragmentName: 'RoleDetails',
      onType: 'Role',
      fields: [{ name: 'name' }],
      path: './role.tsx',
    };

    const fragment: GraphQLFragment = {
      variableName: 'userRowFragment',
      fragmentName: 'UserRow',
      onType: 'User',
      fields: [{ name: 'id' }, { type: 'spread', fragment: nestedFragment }],
      path: './user.tsx',
    };

    const result = renderFragment(fragment);

    expect(result).toBe(`fragment UserRow on User {
  id
  ...RoleDetails
}`);
  });
});

// ============================================================================
// renderOperation tests
// ============================================================================

describe('renderOperation', () => {
  it('renders a simple query', () => {
    const operation: GraphQLOperation = {
      type: 'query',
      variableName: 'getUsersQuery',
      operationName: 'GetUsers',
      fields: [{ name: 'users', fields: [{ name: 'id' }, { name: 'name' }] }],
    };

    const result = renderOperation(operation);

    expect(result).toBe(`query GetUsers {
  users {
    id
    name
  }
}`);
  });

  it('renders a query with variables', () => {
    const operation: GraphQLOperation = {
      type: 'query',
      variableName: 'getUserQuery',
      operationName: 'GetUser',
      variables: [{ name: 'id', type: 'Uuid!' }],
      fields: [
        {
          name: 'user',
          args: [{ name: 'id', value: { type: 'variable', variable: 'id' } }],
          fields: [{ name: 'id' }, { name: 'name' }],
        },
      ],
    };

    const result = renderOperation(operation);

    expect(result).toBe(`query GetUser($id: Uuid!) {
  user(id: $id) {
    id
    name
  }
}`);
  });

  it('renders a mutation', () => {
    const operation: GraphQLOperation = {
      type: 'mutation',
      variableName: 'createUserMutation',
      operationName: 'CreateUser',
      variables: [{ name: 'input', type: 'CreateUserInput!' }],
      fields: [
        {
          name: 'createUser',
          args: [
            { name: 'input', value: { type: 'variable', variable: 'input' } },
          ],
          fields: [
            { name: 'user', fields: [{ name: 'id' }, { name: 'name' }] },
          ],
        },
      ],
    };

    const result = renderOperation(operation);

    expect(result).toBe(`mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    user {
      id
      name
    }
  }
}`);
  });
});

// ============================================================================
// mergeFields tests
// ============================================================================

describe('mergeFields', () => {
  it('merges duplicate simple fields', () => {
    const fields: GraphQLField[] = [
      { name: 'id' },
      { name: 'name' },
      { name: 'id' },
    ];

    const result = mergeGraphqlFields(fields);

    expect(result).toHaveLength(2);
    expect(result.map((f) => (isSimpleField(f) ? f.name : null))).toEqual([
      'id',
      'name',
    ]);
  });

  it('merges nested fields from duplicate parents', () => {
    const fields: GraphQLField[] = [
      { name: 'user', fields: [{ name: 'id' }] },
      { name: 'user', fields: [{ name: 'name' }] },
    ];

    const result = mergeGraphqlFields(fields);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: 'user',
      fields: [{ name: 'id' }, { name: 'name' }],
    });
  });

  it('throws on conflicting arguments', () => {
    const fields: GraphQLField[] = [
      {
        name: 'user',
        args: [{ name: 'id', value: { type: 'scalar', value: '1' } }],
      },
      {
        name: 'user',
        args: [{ name: 'id', value: { type: 'scalar', value: '2' } }],
      },
    ];

    expect(() => mergeGraphqlFields(fields)).toThrow(
      'Unable to merge fields with different args: user',
    );
  });

  it('merges duplicate spread fields', () => {
    const fragment: GraphQLFragment = {
      variableName: 'userFragment',
      fragmentName: 'UserDetails',
      onType: 'User',
      fields: [{ name: 'id' }],
      path: './user.tsx',
    };

    const fields: GraphQLField[] = [
      { type: 'spread', fragment },
      { name: 'id' },
      { type: 'spread', fragment },
    ];

    const result = mergeGraphqlFields(fields);

    expect(result).toHaveLength(2);
  });

  it('does not merge different spread fields', () => {
    const fragmentA: GraphQLFragment = {
      variableName: 'fragmentA',
      fragmentName: 'FragmentA',
      onType: 'User',
      fields: [{ name: 'id' }],
      path: './a.tsx',
    };

    const fragmentB: GraphQLFragment = {
      variableName: 'fragmentB',
      fragmentName: 'FragmentB',
      onType: 'User',
      fields: [{ name: 'name' }],
      path: './b.tsx',
    };

    const fields: GraphQLField[] = [
      { type: 'spread', fragment: fragmentA },
      { type: 'spread', fragment: fragmentB },
    ];

    const result = mergeGraphqlFields(fields);

    expect(result).toHaveLength(2);
  });
});

// ============================================================================
// areFieldsIdentical tests
// ============================================================================

describe('areFieldsIdentical', () => {
  it('returns true for identical fields', () => {
    const fieldsA: GraphQLField[] = [{ name: 'id' }, { name: 'name' }];
    const fieldsB: GraphQLField[] = [{ name: 'id' }, { name: 'name' }];

    expect(areFieldsIdentical(fieldsA, fieldsB)).toBe(true);
  });

  it('returns false for different fields', () => {
    const fieldsA: GraphQLField[] = [{ name: 'id' }];
    const fieldsB: GraphQLField[] = [{ name: 'name' }];

    expect(areFieldsIdentical(fieldsA, fieldsB)).toBe(false);
  });
});

// ============================================================================
// type guards tests
// ============================================================================

describe('type guards', () => {
  it('isSpreadField correctly identifies spread fields', () => {
    const spreadField = {
      type: 'spread' as const,
      fragment: {
        variableName: 'userFragment',
        fragmentName: 'UserDetails',
        onType: 'User',
        fields: [],
        path: './user.tsx',
      },
    };

    const simpleField = { name: 'id' };

    expect(isSpreadField(spreadField)).toBe(true);
    expect(isSpreadField(simpleField)).toBe(false);
  });

  it('isSimpleField correctly identifies simple fields', () => {
    const spreadField = {
      type: 'spread' as const,
      fragment: {
        variableName: 'userFragment',
        fragmentName: 'UserDetails',
        onType: 'User',
        fields: [],
        path: './user.tsx',
      },
    };

    const simpleField = { name: 'id' };
    const simpleFieldExplicit = { type: 'simple' as const, name: 'id' };

    expect(isSimpleField(simpleField)).toBe(true);
    expect(isSimpleField(simpleFieldExplicit)).toBe(true);
    expect(isSimpleField(spreadField)).toBe(false);
  });
});

// ============================================================================
// collectFragmentDependencies tests
// ============================================================================

describe('collectFragmentDependencies', () => {
  it('returns empty array for fields without spreads', () => {
    const fields: GraphQLField[] = [{ name: 'id' }, { name: 'name' }];

    const result = collectFragmentDependencies(fields);

    expect(result).toEqual([]);
  });

  it('collects fragment dependencies from spread fields', () => {
    const fragment: GraphQLFragment = {
      variableName: 'userDetailsFragment',
      fragmentName: 'UserDetails',
      onType: 'User',
      fields: [{ name: 'id' }],
      path: './user-details.tsx',
    };

    const fields: GraphQLField[] = [
      { name: 'id' },
      { type: 'spread', fragment },
    ];

    const result = collectFragmentDependencies(fields);

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(fragment);
  });

  it('collects nested fragment dependencies', () => {
    const nestedFragment: GraphQLFragment = {
      variableName: 'roleFragment',
      fragmentName: 'Role',
      onType: 'Role',
      fields: [{ name: 'name' }],
      path: './role.tsx',
    };

    const fields: GraphQLField[] = [
      { name: 'id' },
      {
        name: 'user',
        fields: [
          { name: 'name' },
          { type: 'spread', fragment: nestedFragment },
        ],
      },
    ];

    const result = collectFragmentDependencies(fields);

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(nestedFragment);
  });

  it('deduplicates fragments by variable name', () => {
    const fragment: GraphQLFragment = {
      variableName: 'userFragment',
      fragmentName: 'UserDetails',
      onType: 'User',
      fields: [{ name: 'id' }],
      path: './user.tsx',
    };

    const fields: GraphQLField[] = [
      { type: 'spread', fragment },
      { name: 'other', fields: [{ type: 'spread', fragment }] },
    ];

    const result = collectFragmentDependencies(fields);

    expect(result).toHaveLength(1);
  });
});

// ============================================================================
// renderFields tests
// ============================================================================

describe('renderFields', () => {
  it('sorts simple fields before spread fields', () => {
    const fragment: GraphQLFragment = {
      variableName: 'roleFragment',
      fragmentName: 'RoleDetails',
      onType: 'Role',
      fields: [{ name: 'name' }],
      path: './role.tsx',
    };

    const fields: GraphQLField[] = [
      { type: 'spread', fragment },
      { name: 'id' },
      { name: 'name' },
    ];

    const result = renderFields(fields);

    expect(result).toBe(`id
name
...RoleDetails`);
  });

  it('sorts fields by order property', () => {
    const fields: GraphQLField[] = [
      { name: 'third', order: 3 },
      { name: 'first', order: 1 },
      { name: 'second', order: 2 },
    ];

    const result = renderFields(fields);

    expect(result).toBe(`first
second
third`);
  });
});
