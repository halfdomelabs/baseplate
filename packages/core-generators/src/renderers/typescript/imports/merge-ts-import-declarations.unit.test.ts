import { pickBy, sortBy } from 'es-toolkit';
import { describe, expect, it } from 'vitest';

import type { TsImportDeclaration } from './types.js';

import {
  ImportConflictError,
  mergeTsImportDeclarations,
} from './merge-ts-import-declarations.js';

function stripUndefinedChildren<T extends Record<string, unknown>>(obj: T): T {
  return pickBy(obj, (value) => value !== undefined) as T;
}

function mergeTsImportDeclarationsSorted(
  declarations: TsImportDeclaration[],
): TsImportDeclaration[] {
  const sortedImports = sortBy(mergeTsImportDeclarations(declarations), [
    (d) => d.moduleSpecifier,
    (d) => (d.isTypeOnly ? 0 : 1),
  ]);
  return sortedImports.map((d) =>
    stripUndefinedChildren({
      ...d,
      namedImports: d.namedImports?.map((i) =>
        stripUndefinedChildren({ ...i }),
      ),
    }),
  );
}

describe('mergeTsImportDeclarations', () => {
  it('should merge named imports from the same source', () => {
    const input: TsImportDeclaration[] = [
      {
        moduleSpecifier: 'react',
        namedImports: [{ name: 'useState' }],
      },
      {
        moduleSpecifier: 'react',
        namedImports: [{ name: 'useEffect' }],
      },
    ];

    const result = mergeTsImportDeclarationsSorted(input);
    expect(result).toEqual([
      {
        moduleSpecifier: 'react',
        namedImports: [{ name: 'useEffect' }, { name: 'useState' }],
      },
    ]);
  });

  it('should throw on conflicting aliases', () => {
    const input: TsImportDeclaration[] = [
      {
        moduleSpecifier: 'module',
        namedImports: [{ name: 'thing', alias: 'thing1' }],
      },
      {
        moduleSpecifier: 'module',
        namedImports: [{ name: 'thing', alias: 'thing2' }],
      },
    ];

    expect(() => mergeTsImportDeclarationsSorted(input)).toThrow(
      ImportConflictError,
    );
  });

  it('should throw on conflicting namespace imports', () => {
    const input: TsImportDeclaration[] = [
      {
        moduleSpecifier: 'module',
        namespaceImport: 'ns1',
      },
      {
        moduleSpecifier: 'module',
        namespaceImport: 'ns2',
      },
    ];

    expect(() => mergeTsImportDeclarationsSorted(input)).toThrow(
      ImportConflictError,
    );
  });

  it('should throw on conflicting default imports', () => {
    const input: TsImportDeclaration[] = [
      {
        moduleSpecifier: 'module',
        defaultImport: 'default1',
      },
      {
        moduleSpecifier: 'module',
        defaultImport: 'default2',
      },
    ];

    expect(() => mergeTsImportDeclarationsSorted(input)).toThrow(
      ImportConflictError,
    );
  });

  it('should keep type-only and regular imports separate', () => {
    const input: TsImportDeclaration[] = [
      {
        moduleSpecifier: 'lib',
        isTypeOnly: true,
        namedImports: [{ name: 'Foo', isTypeOnly: false }],
      },
      {
        moduleSpecifier: 'lib',
        namedImports: [{ name: 'Soo', isTypeOnly: false }],
      },
    ];

    const result = mergeTsImportDeclarationsSorted(input);
    expect(result).toEqual([
      {
        moduleSpecifier: 'lib',
        isTypeOnly: true,
        namedImports: [{ name: 'Foo' }],
      },
      {
        moduleSpecifier: 'lib',
        namedImports: [{ name: 'Soo' }],
      },
    ]);
  });

  it('should merge multiple type-only imports', () => {
    const input: TsImportDeclaration[] = [
      {
        moduleSpecifier: 'types',
        isTypeOnly: true,
        namedImports: [{ name: 'Type1' }],
      },
      {
        moduleSpecifier: 'types',
        isTypeOnly: true,
        namedImports: [{ name: 'Type2' }],
      },
    ];

    const result = mergeTsImportDeclarationsSorted(input);
    expect(result).toEqual([
      {
        moduleSpecifier: 'types',
        isTypeOnly: true,
        namedImports: [{ name: 'Type1' }, { name: 'Type2' }],
      },
    ]);
  });

  it('should merge multiple regular imports', () => {
    const input: TsImportDeclaration[] = [
      {
        moduleSpecifier: 'module',
        namedImports: [{ name: 'func1' }],
      },
      {
        moduleSpecifier: 'module',
        namedImports: [{ name: 'func2' }],
      },
    ];

    const result = mergeTsImportDeclarationsSorted(input);
    expect(result).toEqual([
      {
        moduleSpecifier: 'module',
        namedImports: [{ name: 'func1' }, { name: 'func2' }],
      },
    ]);
  });

  it('should throw on conflicting aliases within the same type category', () => {
    const input: TsImportDeclaration[] = [
      {
        moduleSpecifier: 'module',
        isTypeOnly: true,
        namedImports: [{ name: 'thing', alias: 'thing1' }],
      },
      {
        moduleSpecifier: 'module',
        isTypeOnly: true,
        namedImports: [{ name: 'thing', alias: 'thing2' }],
      },
    ];

    expect(() => mergeTsImportDeclarationsSorted(input)).toThrow(
      ImportConflictError,
    );
  });

  it('should sort named imports by name', () => {
    const input: TsImportDeclaration[] = [
      {
        moduleSpecifier: 'source',
        namedImports: [{ name: 'z' }, { name: 'b' }, { name: 'a' }],
      },
    ];

    const result = mergeTsImportDeclarationsSorted(input);
    expect(result[0].namedImports?.map((d) => d.name)).toEqual(['a', 'b', 'z']);
  });

  it('should remove type imports that exist as regular imports', () => {
    const input: TsImportDeclaration[] = [
      {
        moduleSpecifier: 'module',
        isTypeOnly: true,
        namedImports: [{ name: 'Thing' }, { name: 'OtherThing' }],
      },
      {
        moduleSpecifier: 'module',
        namedImports: [{ name: 'Thing' }],
      },
    ];

    const result = mergeTsImportDeclarationsSorted(input);
    expect(result).toEqual([
      {
        moduleSpecifier: 'module',
        isTypeOnly: true,
        namedImports: [{ name: 'OtherThing' }],
      },
      {
        moduleSpecifier: 'module',
        namedImports: [{ name: 'Thing' }],
      },
    ]);
  });

  it('should handle default imports existing in both type and regular imports', () => {
    const input: TsImportDeclaration[] = [
      {
        moduleSpecifier: 'module',
        isTypeOnly: true,
        defaultImport: 'Thing',
      },
      {
        moduleSpecifier: 'module',
        defaultImport: 'Thing',
      },
    ];

    const result = mergeTsImportDeclarationsSorted(input);
    expect(result).toEqual([
      {
        moduleSpecifier: 'module',
        defaultImport: 'Thing',
      },
    ]);
  });

  it('should handle namespace imports existing in both type and regular imports', () => {
    const input: TsImportDeclaration[] = [
      {
        moduleSpecifier: 'module',
        isTypeOnly: true,
        namespaceImport: 'Types',
      },
      {
        moduleSpecifier: 'module',
        namespaceImport: 'Types',
      },
    ];

    const result = mergeTsImportDeclarationsSorted(input);
    expect(result).toEqual([
      {
        moduleSpecifier: 'module',
        namespaceImport: 'Types',
      },
    ]);
  });

  it('should handle mixed type and regular imports with partial overlap', () => {
    const input: TsImportDeclaration[] = [
      {
        moduleSpecifier: 'module',
        isTypeOnly: true,
        defaultImport: 'Thing',
        namedImports: [{ name: 'Type1' }, { name: 'Type2' }],
      },
      {
        moduleSpecifier: 'module',
        defaultImport: 'Thing',
        namedImports: [{ name: 'Type1' }, { name: 'Value1' }],
      },
    ];

    const result = mergeTsImportDeclarationsSorted(input);
    expect(result).toEqual([
      {
        moduleSpecifier: 'module',
        isTypeOnly: true,
        namedImports: [{ name: 'Type2' }],
      },
      {
        moduleSpecifier: 'module',
        defaultImport: 'Thing',
        namedImports: [{ name: 'Type1' }, { name: 'Value1' }],
      },
    ]);
  });
});
