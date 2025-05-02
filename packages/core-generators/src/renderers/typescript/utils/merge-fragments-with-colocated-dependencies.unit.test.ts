import { describe, expect, it } from 'vitest';

import { tsCodeFragment } from '../fragments/creators.js';
import { tsImportBuilder } from '../imports/builder.js';
import { mergeFragmentsWithColocatedDependencies } from './merge-fragments-with-colocated-dependencies.js';

describe('mergeFragmentsWithColocatedDependencies', () => {
  it('should handle empty fragments array', () => {
    const result = mergeFragmentsWithColocatedDependencies([]);
    expect(result).toEqual({
      contents: '',
      imports: [],
      hoistedFragments: [],
    });
  });

  it('should merge fragments with their dependencies colocated', () => {
    const createUserType = {
      name: 'CreateUserType',
      fragment: tsCodeFragment(
        'type CreateUserType = { name: string; email: string; };',
      ),
    };

    const createUserFunction = {
      name: 'createUser',
      fragment: tsCodeFragment(
        'async function createUser(input: CreateUserType) { /* ... */ }',
      ),
      dependencies: [createUserType],
    };

    const result = mergeFragmentsWithColocatedDependencies([
      createUserFunction,
    ]);

    expect(result.contents).toBe(
      'type CreateUserType = { name: string; email: string; };\n\nasync function createUser(input: CreateUserType) { /* ... */ }',
    );
  });

  it('should handle shared dependencies between multiple fragments', () => {
    const baseUserType = {
      name: 'BaseUserType',
      fragment: tsCodeFragment(
        'type BaseUserType = { id: string; createdAt: Date; };',
      ),
    };

    const createUserType = {
      name: 'CreateUserType',
      fragment: tsCodeFragment(
        'type CreateUserType = BaseUserType & { name: string; email: string; };',
      ),
      dependencies: [baseUserType],
    };

    const updateUserType = {
      name: 'UpdateUserType',
      fragment: tsCodeFragment(
        'type UpdateUserType = BaseUserType & { name?: string; email?: string; };',
      ),
      dependencies: [baseUserType],
    };

    const createUserFunction = {
      name: 'createUser',
      fragment: tsCodeFragment(
        'async function createUser(input: CreateUserType) { /* ... */ }',
      ),
      dependencies: [createUserType],
    };

    const updateUserFunction = {
      name: 'updateUser',
      fragment: tsCodeFragment(
        'async function updateUser(id: string, input: UpdateUserType) { /* ... */ }',
      ),
      dependencies: [updateUserType],
    };

    const result = mergeFragmentsWithColocatedDependencies([
      createUserFunction,
      updateUserFunction,
    ]);

    // BaseUserType should appear first since it's a shared dependency
    // Then CreateUserType and createUser function
    // Then UpdateUserType and updateUser function
    expect(result.contents).toBe(
      'type BaseUserType = { id: string; createdAt: Date; };\n\n' +
        'type CreateUserType = BaseUserType & { name: string; email: string; };\n\n' +
        'async function createUser(input: CreateUserType) { /* ... */ }\n\n' +
        'type UpdateUserType = BaseUserType & { name?: string; email?: string; };\n\n' +
        'async function updateUser(id: string, input: UpdateUserType) { /* ... */ }',
    );
  });

  it('should preserve order of root fragments when preserveOrder is true', () => {
    const typeA = {
      name: 'TypeA',
      fragment: tsCodeFragment('type TypeA = string;'),
    };

    const typeB = {
      name: 'TypeB',
      fragment: tsCodeFragment('type TypeB = number;'),
    };

    const functionB = {
      name: 'functionB',
      fragment: tsCodeFragment('function functionB() { return 2; }'),
      dependencies: [typeB],
    };

    const functionA = {
      name: 'functionA',
      fragment: tsCodeFragment('function functionA() { return 1; }'),
      dependencies: [typeA],
    };

    const result = mergeFragmentsWithColocatedDependencies(
      [functionB, functionA], // Note: functionB comes first
      '\n\n',
      { preserveOrder: true },
    );

    // Even though functionA comes alphabetically before functionB,
    // the order should be preserved because preserveOrder is true
    expect(result.contents).toBe(
      'type TypeB = number;\n\n' +
        'function functionB() { return 2; }\n\n' +
        'type TypeA = string;\n\n' +
        'function functionA() { return 1; }',
    );
  });

  it('should sort root fragments alphabetically when preserveOrder is false', () => {
    const typeA = {
      name: 'TypeA',
      fragment: tsCodeFragment('type TypeA = string;'),
    };

    const typeB = {
      name: 'TypeB',
      fragment: tsCodeFragment('type TypeB = number;'),
    };

    const functionB = {
      name: 'functionB',
      fragment: tsCodeFragment('function functionB() { return 2; }'),
      dependencies: [typeB],
    };

    const functionA = {
      name: 'functionA',
      fragment: tsCodeFragment('function functionA() { return 1; }'),
      dependencies: [typeA],
    };

    const result = mergeFragmentsWithColocatedDependencies(
      [functionB, functionA], // Note: functionB comes first
      '\n\n',
      { preserveOrder: false },
    );

    // functionA should come before functionB because it's alphabetically first
    expect(result.contents).toBe(
      'type TypeA = string;\n\n' +
        'function functionA() { return 1; }\n\n' +
        'type TypeB = number;\n\n' +
        'function functionB() { return 2; }',
    );
  });

  it('should handle imports and hoisted fragments', () => {
    const userImport = tsImportBuilder().named('User').from('./user.js');
    const dateImport = tsImportBuilder().named('Date').from('./date.js');

    const userType = {
      name: 'UserType',
      fragment: tsCodeFragment('type UserType = { user: User; };', userImport),
    };

    const dateType = {
      name: 'DateType',
      fragment: tsCodeFragment('type DateType = { date: Date; };', dateImport),
    };

    const userFunction = {
      name: 'getUser',
      fragment: tsCodeFragment('function getUser(): UserType { /* ... */ }'),
      dependencies: [userType],
    };

    const dateFunction = {
      name: 'getDate',
      fragment: tsCodeFragment('function getDate(): DateType { /* ... */ }'),
      dependencies: [dateType],
    };

    const result = mergeFragmentsWithColocatedDependencies([
      userFunction,
      dateFunction,
    ]);

    expect(result.imports).toHaveLength(2);
    expect(result.imports).toEqual(
      expect.arrayContaining([userImport, dateImport]),
    );
    expect(result.contents).toBe(
      'type DateType = { date: Date; };\n\n' +
        'function getDate(): DateType { /* ... */ }\n\n' +
        'type UserType = { user: User; };\n\n' +
        'function getUser(): UserType { /* ... */ }',
    );
  });

  it('should throw error for duplicate fragment names with different contents', () => {
    const typeA = {
      name: 'TypeA',
      fragment: tsCodeFragment('type TypeA = string;'),
    };

    const typeADuplicate = {
      name: 'TypeA',
      fragment: tsCodeFragment('type TypeA = number;'), // Different content
    };

    const functionA = {
      name: 'functionA',
      fragment: tsCodeFragment('function functionA() { return 1; }'),
      dependencies: [typeA],
    };

    const functionB = {
      name: 'functionB',
      fragment: tsCodeFragment('function functionB() { return 2; }'),
      dependencies: [typeADuplicate],
    };

    expect(() =>
      mergeFragmentsWithColocatedDependencies([functionA, functionB]),
    ).toThrow('Duplicate hoisted fragment key TypeA with different contents');
  });

  it('should handle nested dependencies', () => {
    const baseType = {
      name: 'BaseType',
      fragment: tsCodeFragment('type BaseType = { id: string; };'),
    };

    const middleType = {
      name: 'MiddleType',
      fragment: tsCodeFragment(
        'type MiddleType = BaseType & { name: string; };',
      ),
      dependencies: [baseType],
    };

    const topType = {
      name: 'TopType',
      fragment: tsCodeFragment(
        'type TopType = MiddleType & { email: string; };',
      ),
      dependencies: [middleType],
    };

    const functionA = {
      name: 'functionA',
      fragment: tsCodeFragment('function functionA(): TopType { /* ... */ }'),
      dependencies: [topType],
    };

    const result = mergeFragmentsWithColocatedDependencies([functionA]);

    // Dependencies should be ordered from most basic to most specific
    expect(result.contents).toBe(
      'type BaseType = { id: string; };\n\n' +
        'type MiddleType = BaseType & { name: string; };\n\n' +
        'type TopType = MiddleType & { email: string; };\n\n' +
        'function functionA(): TopType { /* ... */ }',
    );
  });
});
