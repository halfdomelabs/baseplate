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
    (d) => d.source,
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
        source: 'react',
        namedImports: [{ name: 'useState' }],
      },
      {
        source: 'react',
        namedImports: [{ name: 'useEffect' }],
      },
    ];

    const result = mergeTsImportDeclarationsSorted(input);
    expect(result).toEqual([
      {
        source: 'react',
        namedImports: [{ name: 'useEffect' }, { name: 'useState' }],
      },
    ]);
  });

  it('should throw on conflicting aliases', () => {
    const input: TsImportDeclaration[] = [
      {
        source: 'module',
        namedImports: [{ name: 'thing', alias: 'thing1' }],
      },
      {
        source: 'module',
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
        source: 'module',
        namespaceImport: 'ns1',
      },
      {
        source: 'module',
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
        source: 'module',
        defaultImport: 'default1',
      },
      {
        source: 'module',
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
        source: 'lib',
        isTypeOnly: true,
        namedImports: [{ name: 'Foo', isTypeOnly: false }],
      },
      {
        source: 'lib',
        namedImports: [{ name: 'Soo', isTypeOnly: false }],
      },
    ];

    const result = mergeTsImportDeclarationsSorted(input);
    expect(result).toEqual([
      {
        source: 'lib',
        isTypeOnly: true,
        namedImports: [{ name: 'Foo' }],
      },
      {
        source: 'lib',
        namedImports: [{ name: 'Soo' }],
      },
    ]);
  });

  it('should merge multiple type-only imports', () => {
    const input: TsImportDeclaration[] = [
      {
        source: 'types',
        isTypeOnly: true,
        namedImports: [{ name: 'Type1' }],
      },
      {
        source: 'types',
        isTypeOnly: true,
        namedImports: [{ name: 'Type2' }],
      },
    ];

    const result = mergeTsImportDeclarationsSorted(input);
    expect(result).toEqual([
      {
        source: 'types',
        isTypeOnly: true,
        namedImports: [{ name: 'Type1' }, { name: 'Type2' }],
      },
    ]);
  });

  it('should merge multiple regular imports', () => {
    const input: TsImportDeclaration[] = [
      {
        source: 'module',
        namedImports: [{ name: 'func1' }],
      },
      {
        source: 'module',
        namedImports: [{ name: 'func2' }],
      },
    ];

    const result = mergeTsImportDeclarationsSorted(input);
    expect(result).toEqual([
      {
        source: 'module',
        namedImports: [{ name: 'func1' }, { name: 'func2' }],
      },
    ]);
  });

  it('should throw on conflicting aliases within the same type category', () => {
    const input: TsImportDeclaration[] = [
      {
        source: 'module',
        isTypeOnly: true,
        namedImports: [{ name: 'thing', alias: 'thing1' }],
      },
      {
        source: 'module',
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
        source: 'source',
        namedImports: [{ name: 'z' }, { name: 'b' }, { name: 'a' }],
      },
    ];

    const result = mergeTsImportDeclarationsSorted(input);
    expect(result[0].namedImports?.map((d) => d.name)).toEqual(['a', 'b', 'z']);
  });

  it('should remove type imports that exist as regular imports', () => {
    const input: TsImportDeclaration[] = [
      {
        source: 'module',
        isTypeOnly: true,
        namedImports: [{ name: 'Thing' }, { name: 'OtherThing' }],
      },
      {
        source: 'module',
        namedImports: [{ name: 'Thing' }],
      },
    ];

    const result = mergeTsImportDeclarationsSorted(input);
    expect(result).toEqual([
      {
        source: 'module',
        isTypeOnly: true,
        namedImports: [{ name: 'OtherThing' }],
      },
      {
        source: 'module',
        namedImports: [{ name: 'Thing' }],
      },
    ]);
  });

  it('should handle default imports existing in both type and regular imports', () => {
    const input: TsImportDeclaration[] = [
      {
        source: 'module',
        isTypeOnly: true,
        defaultImport: 'Thing',
      },
      {
        source: 'module',
        defaultImport: 'Thing',
      },
    ];

    const result = mergeTsImportDeclarationsSorted(input);
    expect(result).toEqual([
      {
        source: 'module',
        defaultImport: 'Thing',
      },
    ]);
  });

  it('should handle namespace imports existing in both type and regular imports', () => {
    const input: TsImportDeclaration[] = [
      {
        source: 'module',
        isTypeOnly: true,
        namespaceImport: 'Types',
      },
      {
        source: 'module',
        namespaceImport: 'Types',
      },
    ];

    const result = mergeTsImportDeclarationsSorted(input);
    expect(result).toEqual([
      {
        source: 'module',
        namespaceImport: 'Types',
      },
    ]);
  });

  it('should handle mixed type and regular imports with partial overlap', () => {
    const input: TsImportDeclaration[] = [
      {
        source: 'module',
        isTypeOnly: true,
        defaultImport: 'Thing',
        namedImports: [{ name: 'Type1' }, { name: 'Type2' }],
      },
      {
        source: 'module',
        defaultImport: 'Thing',
        namedImports: [{ name: 'Type1' }, { name: 'Value1' }],
      },
    ];

    const result = mergeTsImportDeclarationsSorted(input);
    expect(result).toEqual([
      {
        source: 'module',
        isTypeOnly: true,
        namedImports: [{ name: 'Type2' }],
      },
      {
        source: 'module',
        defaultImport: 'Thing',
        namedImports: [{ name: 'Type1' }, { name: 'Value1' }],
      },
    ]);
  });
});
