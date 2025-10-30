import { describe, expect, it } from 'vitest';

import {
  tsCodeFragment,
  tsImportBuilder,
} from '../renderers/typescript/index.js';
import {
  areFragmentsEqual,
  normalizeFragment,
  normalizeHoistedFragments,
  normalizeImports,
} from './utils.js';

describe('normalizeImports', () => {
  it('sorts imports by module specifier', () => {
    const imports = [
      { moduleSpecifier: 'zod', namedImports: [{ name: 'z' }] },
      { moduleSpecifier: '@prisma/client', namedImports: [{ name: 'Prisma' }] },
      { moduleSpecifier: 'react', namedImports: [{ name: 'useState' }] },
    ];

    const normalized = normalizeImports(imports);

    expect(normalized).toEqual([
      { moduleSpecifier: '@prisma/client', namedImports: [{ name: 'Prisma' }] },
      { moduleSpecifier: 'react', namedImports: [{ name: 'useState' }] },
      { moduleSpecifier: 'zod', namedImports: [{ name: 'z' }] },
    ]);
  });

  it('sorts named imports alphabetically', () => {
    const imports = [
      {
        moduleSpecifier: 'zod',
        namedImports: [
          { name: 'z' },
          { name: 'ZodError' },
          { name: 'ZodSchema' },
        ],
      },
    ];

    const normalized = normalizeImports(imports);

    expect(normalized[0].namedImports).toEqual([
      { name: 'z' },
      { name: 'ZodError' },
      { name: 'ZodSchema' },
    ]);
  });

  it('sorts by import type (namespace > default > named)', () => {
    const imports = [
      { moduleSpecifier: 'a', namedImports: [{ name: 'foo' }] },
      { moduleSpecifier: 'a', defaultImport: 'Bar' },
      { moduleSpecifier: 'a', namespaceImport: 'baz' },
    ];

    const normalized = normalizeImports(imports);

    expect(normalized[0]).toHaveProperty('namespaceImport');
    expect(normalized[1]).toHaveProperty('defaultImport');
    expect(normalized[2]).toHaveProperty('namedImports');
  });

  it('places type-only imports first within same module', () => {
    const imports = [
      {
        moduleSpecifier: 'a',
        namedImports: [{ name: 'foo' }],
        isTypeOnly: false,
      },
      {
        moduleSpecifier: 'a',
        namedImports: [{ name: 'bar' }],
        isTypeOnly: true,
      },
    ];

    const normalized = normalizeImports(imports);

    expect(normalized[0].isTypeOnly).toBe(true);
    expect(normalized[1].isTypeOnly).toBe(false);
  });
});

describe('normalizeHoistedFragments', () => {
  it('returns undefined for empty array', () => {
    expect(normalizeHoistedFragments([])).toBeUndefined();
  });

  it('returns undefined for undefined input', () => {
    expect(normalizeHoistedFragments(undefined)).toBeUndefined();
  });

  it('sorts hoisted fragments by key', () => {
    const fragments = [
      { key: 'c', contents: 'const c = 3;', imports: [] },
      { key: 'a', contents: 'const a = 1;', imports: [] },
      { key: 'b', contents: 'const b = 2;', imports: [] },
    ];

    const normalized = normalizeHoistedFragments(fragments);

    expect(normalized).toEqual([
      { key: 'a', contents: 'const a = 1;' },
      { key: 'b', contents: 'const b = 2;' },
      { key: 'c', contents: 'const c = 3;' },
    ]);
  });
});

describe('normalizeFragment', () => {
  it('trims fragment contents', () => {
    const fragment = tsCodeFragment('  foo()  ');

    const normalized = normalizeFragment(fragment);

    expect(normalized.contents).toBe('foo()');
  });

  it('normalizes imports', () => {
    const fragment = tsCodeFragment('foo()', [
      tsImportBuilder(['z']).from('zod'),
      tsImportBuilder(['Prisma']).from('@prisma/client'),
    ]);

    const normalized = normalizeFragment(fragment);

    expect(normalized.imports?.[0].moduleSpecifier).toBe('@prisma/client');
    expect(normalized.imports?.[1].moduleSpecifier).toBe('zod');
  });

  it('normalizes hoisted fragments by default', () => {
    const fragment = tsCodeFragment('foo()', undefined, {
      hoistedFragments: [
        { key: 'b', contents: 'const b = 2;', imports: [] },
        { key: 'a', contents: 'const a = 1;', imports: [] },
      ],
    });

    const normalized = normalizeFragment(fragment);

    expect(normalized.hoistedFragments?.[0].key).toBe('a');
    expect(normalized.hoistedFragments?.[1].key).toBe('b');
  });

  it('ignores hoisted fragments when compareHoistedFragments is false', () => {
    const fragment = tsCodeFragment('foo()', undefined, {
      hoistedFragments: [{ key: 'a', contents: 'const a = 1;', imports: [] }],
    });

    const normalized = normalizeFragment(fragment, {
      compareHoistedFragments: false,
    });

    expect(normalized.hoistedFragments).toBeUndefined();
  });
});

describe('areFragmentsEqual', () => {
  it('returns true for identical fragments', () => {
    const fragment1 = tsCodeFragment('foo()');
    const fragment2 = tsCodeFragment('foo()');

    expect(areFragmentsEqual(fragment1, fragment2)).toBe(true);
  });

  it('returns false for different contents', () => {
    const fragment1 = tsCodeFragment('foo()');
    const fragment2 = tsCodeFragment('bar()');

    expect(areFragmentsEqual(fragment1, fragment2)).toBe(false);
  });

  it('returns true for same imports in different order', () => {
    const fragment1 = tsCodeFragment('foo()', [
      tsImportBuilder(['z']).from('zod'),
      tsImportBuilder(['Prisma']).from('@prisma/client'),
    ]);

    const fragment2 = tsCodeFragment('foo()', [
      tsImportBuilder(['Prisma']).from('@prisma/client'),
      tsImportBuilder(['z']).from('zod'),
    ]);

    expect(areFragmentsEqual(fragment1, fragment2)).toBe(true);
  });

  it('returns false for different imports', () => {
    const fragment1 = tsCodeFragment(
      'foo()',
      tsImportBuilder(['z']).from('zod'),
    );

    const fragment2 = tsCodeFragment(
      'foo()',
      tsImportBuilder(['Prisma']).from('@prisma/client'),
    );

    expect(areFragmentsEqual(fragment1, fragment2)).toBe(false);
  });

  it('returns true for same hoisted fragments in different order', () => {
    const fragment1 = tsCodeFragment('foo()', undefined, {
      hoistedFragments: [
        { key: 'b', contents: 'const b = 2;', imports: [] },
        { key: 'a', contents: 'const a = 1;', imports: [] },
      ],
    });

    const fragment2 = tsCodeFragment('foo()', undefined, {
      hoistedFragments: [
        { key: 'a', contents: 'const a = 1;', imports: [] },
        { key: 'b', contents: 'const b = 2;', imports: [] },
      ],
    });

    expect(areFragmentsEqual(fragment1, fragment2)).toBe(true);
  });

  it('ignores hoisted fragments when compareHoistedFragments is false', () => {
    const fragment1 = tsCodeFragment('foo()', undefined, {
      hoistedFragments: [{ key: 'a', contents: 'const a = 1;', imports: [] }],
    });

    const fragment2 = tsCodeFragment('foo()');

    expect(
      areFragmentsEqual(fragment1, fragment2, {
        compareHoistedFragments: false,
      }),
    ).toBe(true);
  });

  it('handles fragments with whitespace differences in contents', () => {
    const fragment1 = tsCodeFragment('  foo()  ');
    const fragment2 = tsCodeFragment('foo()');

    expect(areFragmentsEqual(fragment1, fragment2)).toBe(true);
  });
});
