import { describe, expect, it } from 'vitest';

import type { TsCodeFragment, TsHoistedFragment } from './types.js';

import { tsImportBuilder } from '../imports/builder.js';
import { tsCodeFragment, tsHoistedFragment } from './creators.js';
import {
  flattenImportsAndHoistedFragments,
  mergeFragmentsWithHoistedFragments,
  mergeFragmentsWithHoistedFragmentsPresorted,
} from './utils.js';

describe('flattenImportsAndHoistedFragments', () => {
  it('should handle empty fragments array', () => {
    const result = flattenImportsAndHoistedFragments([]);
    expect(result).toEqual({
      imports: [],
      hoistedFragments: [],
    });
  });

  it('should flatten imports from multiple fragments', () => {
    const fragments: TsCodeFragment[] = [
      {
        contents: 'const a = 1;',
        imports: [
          { moduleSpecifier: 'module-a', namedImports: [{ name: 'A' }] },
        ],
      },
      {
        contents: 'const b = 2;',
        imports: [
          { moduleSpecifier: 'module-b', namedImports: [{ name: 'B' }] },
        ],
      },
    ];

    const result = flattenImportsAndHoistedFragments(fragments);
    expect(result.imports).toHaveLength(2);
    expect(result.imports).toEqual([
      { moduleSpecifier: 'module-a', namedImports: [{ name: 'A' }] },
      { moduleSpecifier: 'module-b', namedImports: [{ name: 'B' }] },
    ]);
  });

  it('should handle nested hoisted fragments with correct ordering', () => {
    const nestedFragment: TsHoistedFragment = {
      key: 'nested-type',
      contents: 'type NestedType = string;',
    };

    const fragments: TsCodeFragment[] = [
      {
        contents: 'const root = true;',
        hoistedFragments: [
          {
            key: 'root-type',
            contents: 'type RootType = string;',
            hoistedFragments: [nestedFragment],
          },
        ],
      },
    ];

    const result = flattenImportsAndHoistedFragments(fragments);
    expect(result.hoistedFragments[0].key).toBe('nested-type');
    expect(result.hoistedFragments[1].key).toBe('root-type');
  });

  it('should deduplicate hoisted fragments by key', () => {
    const fragments: TsCodeFragment[] = [
      {
        contents: 'const a = 1;',
        hoistedFragments: [
          {
            key: 'duplicate-key',
            contents: 'type DuplicateKey = number;',
            hoistedFragments: [],
          },
        ],
      },
      {
        contents: 'const b = 2;',
        hoistedFragments: [
          {
            key: 'duplicate-key',
            contents: 'type DuplicateKey = number;',
            hoistedFragments: [],
          },
        ],
      },
    ];

    const result = flattenImportsAndHoistedFragments(fragments);
    expect(result.hoistedFragments).toHaveLength(1);
    expect(result.hoistedFragments[0].key).toBe('duplicate-key');
    expect(result.hoistedFragments[0].contents).toBe(
      'type DuplicateKey = number;',
    );
  });

  it('should order hoisted fragments by locality-based topological sort and then by key', () => {
    const fragments: TsCodeFragment[] = [
      {
        contents: 'const a = 1;',
        hoistedFragments: [
          {
            key: 'b-key', // alphabetically second
            contents: 'type B = string;',
          },
          {
            key: 'a-key', // alphabetically first
            contents: 'type A = string;',
          },
        ],
      },
      {
        contents: 'const b = 2;',
        hoistedFragments: [
          {
            key: 'c-key', // alphabetically third
            contents: 'type C = string;',
            hoistedFragments: [
              {
                key: 'z-nested-key', // nested, so next to c-key despite alphabetically last
                contents: 'type Z = string;',
              },
            ],
          },
        ],
      },
    ];

    const result = flattenImportsAndHoistedFragments(fragments);
    expect(result.hoistedFragments).toHaveLength(4);

    // Check ordering: nested fragment should come before c-key
    // and root fragments should be in alphabetical order by key
    expect(result.hoistedFragments.map((h) => h.key)).toEqual([
      'a-key',
      'b-key',
      'z-nested-key',
      'c-key',
    ]);
  });
});

describe('mergeFragmentsWithHoistedFragments', () => {
  it('should handle empty fragments map', () => {
    const result = mergeFragmentsWithHoistedFragments(new Map());
    expect(result).toEqual({
      contents: '',
      imports: [],
    });
  });

  it('should merge fragments with their hoisted dependencies colocated', () => {
    const createUserType = tsHoistedFragment(
      'CreateUserType',
      'type CreateUserType = { name: string; email: string; };',
    );

    const createUserFunction = tsCodeFragment(
      'async function createUser(input: CreateUserType) { /* ... */ }',
      undefined,
      { hoistedFragments: [createUserType] },
    );

    const result = mergeFragmentsWithHoistedFragments(
      new Map([['createUser', createUserFunction]]),
    );

    expect(result.contents).toBe(
      'type CreateUserType = { name: string; email: string; };\n\nasync function createUser(input: CreateUserType) { /* ... */ }',
    );
  });

  it('should handle shared hoisted dependencies between multiple fragments', () => {
    const baseUserType = tsHoistedFragment(
      'BaseUserType',
      'type BaseUserType = { id: string; createdAt: Date; };',
    );

    const createUserType = tsHoistedFragment(
      'CreateUserType',
      'type CreateUserType = BaseUserType & { name: string; email: string; };',
      undefined,
      { hoistedFragments: [baseUserType] },
    );

    const updateUserType = tsHoistedFragment(
      'UpdateUserType',
      'type UpdateUserType = BaseUserType & { name?: string; email?: string; };',
      undefined,
      { hoistedFragments: [baseUserType] },
    );

    const createUserFunction = tsCodeFragment(
      'async function createUser(input: CreateUserType) { /* ... */ }',
      undefined,
      { hoistedFragments: [createUserType] },
    );

    const updateUserFunction = tsCodeFragment(
      'async function updateUser(id: string, input: UpdateUserType) { /* ... */ }',
      undefined,
      { hoistedFragments: [updateUserType] },
    );

    const result = mergeFragmentsWithHoistedFragments(
      new Map([
        ['createUser', createUserFunction],
        ['updateUser', updateUserFunction],
      ]),
    );

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

  it('should handle imports and hoisted fragments', () => {
    const userImport = tsImportBuilder().named('User').from('./user.js');
    const dateImport = tsImportBuilder().named('Date').from('./date.js');

    const userType = tsHoistedFragment(
      'UserType',
      'type UserType = { user: User; };',
      userImport,
    );

    const dateType = tsHoistedFragment(
      'DateType',
      'type DateType = { date: Date; };',
      dateImport,
    );

    const userFunction = tsCodeFragment(
      'function getUser(): UserType { /* ... */ }',
      undefined,
      { hoistedFragments: [userType] },
    );

    const dateFunction = tsCodeFragment(
      'function getDate(): DateType { /* ... */ }',
      undefined,
      { hoistedFragments: [dateType] },
    );

    const result = mergeFragmentsWithHoistedFragments(
      new Map([
        ['getUser', userFunction],
        ['getDate', dateFunction],
      ]),
    );

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

  it('should throw error for duplicate hoisted fragment keys with different contents', () => {
    const typeA = tsHoistedFragment('TypeA', 'type TypeA = string;');
    const typeADuplicate = tsHoistedFragment('TypeA', 'type TypeA = number;'); // Different content

    const functionA = tsCodeFragment(
      'function functionA() { return 1; }',
      undefined,
      { hoistedFragments: [typeA] },
    );

    const functionB = tsCodeFragment(
      'function functionB() { return 2; }',
      undefined,
      { hoistedFragments: [typeADuplicate] },
    );

    expect(() =>
      mergeFragmentsWithHoistedFragments(
        new Map([
          ['functionA', functionA],
          ['functionB', functionB],
        ]),
      ),
    ).toThrow('Duplicate hoisted fragment key TypeA with different contents');
  });

  it('should handle nested hoisted dependencies', () => {
    const baseType = tsHoistedFragment(
      'BaseType',
      'type BaseType = { id: string; };',
    );

    const middleType = tsHoistedFragment(
      'MiddleType',
      'type MiddleType = BaseType & { name: string; };',
      undefined,
      { hoistedFragments: [baseType] },
    );

    const topType = tsHoistedFragment(
      'TopType',
      'type TopType = MiddleType & { email: string; };',
      undefined,
      { hoistedFragments: [middleType] },
    );

    const functionA = tsCodeFragment(
      'function functionA(): TopType { /* ... */ }',
      undefined,
      { hoistedFragments: [topType] },
    );

    const result = mergeFragmentsWithHoistedFragments(
      new Map([['functionA', functionA]]),
    );

    // Dependencies should be ordered from most basic to most specific
    expect(result.contents).toBe(
      'type BaseType = { id: string; };\n\n' +
        'type MiddleType = BaseType & { name: string; };\n\n' +
        'type TopType = MiddleType & { email: string; };\n\n' +
        'function functionA(): TopType { /* ... */ }',
    );
  });
});

describe('mergeFragmentsWithHoistedFragmentsPresorted', () => {
  it('should maintain order of root fragments', () => {
    const typeA = tsHoistedFragment('TypeA', 'type TypeA = string;');
    const typeB = tsHoistedFragment('TypeB', 'type TypeB = number;');

    const functionA = tsCodeFragment(
      'function functionA() { return 1; }',
      undefined,
      { hoistedFragments: [typeA] },
    );

    const functionB = tsCodeFragment(
      'function functionB() { return 2; }',
      undefined,
      { hoistedFragments: [typeB] },
    );

    const result = mergeFragmentsWithHoistedFragmentsPresorted([
      functionB, // Note: functionB comes first
      functionA,
    ]);

    // Even though functionA comes alphabetically before functionB,
    // the order should be preserved because we're using presorted
    expect(result.contents).toBe(
      'type TypeB = number;\n\n' +
        'function functionB() { return 2; }\n\n' +
        'type TypeA = string;\n\n' +
        'function functionA() { return 1; }',
    );
  });

  it('should handle empty fragments array', () => {
    const result = mergeFragmentsWithHoistedFragmentsPresorted([]);
    expect(result).toEqual({
      contents: '',
      imports: [],
    });
  });
});
