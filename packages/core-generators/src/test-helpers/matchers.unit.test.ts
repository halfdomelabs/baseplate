import { describe, expect, it } from 'vitest';

import {
  tsCodeFragment,
  tsImportBuilder,
} from '../renderers/typescript/index.js';
import { extendFragmentMatchers } from './matchers.js';

// Extend matchers before tests
extendFragmentMatchers();

describe('toMatchTsFragment', () => {
  it('matches fragments with same contents and imports', () => {
    const actual = tsCodeFragment('foo()', tsImportBuilder(['z']).from('zod'));

    const expected = tsCodeFragment(
      'foo()',
      tsImportBuilder(['z']).from('zod'),
    );

    expect(actual).toMatchTsFragment(expected);
  });

  it('matches fragments with imports in different order', () => {
    const actual = tsCodeFragment('foo()', [
      tsImportBuilder(['z']).from('zod'),
      tsImportBuilder(['Prisma']).from('@prisma/client'),
    ]);

    const expected = tsCodeFragment('foo()', [
      tsImportBuilder(['Prisma']).from('@prisma/client'),
      tsImportBuilder(['z']).from('zod'),
    ]);

    expect(actual).toMatchTsFragment(expected);
  });

  it('fails when contents differ', () => {
    const actual = tsCodeFragment('foo()');
    const expected = tsCodeFragment('bar()');

    expect(() => {
      expect(actual).toMatchTsFragment(expected);
    }).toThrow();
  });

  it('fails when imports differ', () => {
    const actual = tsCodeFragment('foo()', tsImportBuilder(['z']).from('zod'));

    const expected = tsCodeFragment(
      'foo()',
      tsImportBuilder(['Prisma']).from('@prisma/client'),
    );

    expect(() => {
      expect(actual).toMatchTsFragment(expected);
    }).toThrow();
  });

  it('matches fragments with hoisted fragments in different order', () => {
    const actual = tsCodeFragment('foo()', undefined, {
      hoistedFragments: [
        { key: 'b', contents: 'const b = 2;', imports: [] },
        { key: 'a', contents: 'const a = 1;', imports: [] },
      ],
    });

    const expected = tsCodeFragment('foo()', undefined, {
      hoistedFragments: [
        { key: 'a', contents: 'const a = 1;', imports: [] },
        { key: 'b', contents: 'const b = 2;', imports: [] },
      ],
    });

    expect(actual).toMatchTsFragment(expected);
  });

  it('ignores hoisted fragments when option is set', () => {
    const actual = tsCodeFragment('foo()', undefined, {
      hoistedFragments: [{ key: 'a', contents: 'const a = 1;', imports: [] }],
    });

    const expected = tsCodeFragment('foo()');

    expect(actual).toMatchTsFragment(expected, {
      ignoreHoistedFragments: true,
    });
  });

  it('trims whitespace in contents', () => {
    const actual = tsCodeFragment('  foo()  ');
    const expected = tsCodeFragment('foo()');

    expect(actual).toMatchTsFragment(expected);
  });

  it('supports .not matcher', () => {
    const actual = tsCodeFragment('foo()');
    const expected = tsCodeFragment('bar()');

    expect(actual).not.toMatchTsFragment(expected);
  });
});

describe('toIncludeImport', () => {
  it('passes when import is present', () => {
    const fragment = tsCodeFragment(
      'foo()',
      tsImportBuilder(['z']).from('zod'),
    );

    expect(fragment).toIncludeImport('z', 'zod');
  });

  it('fails when import is not present', () => {
    const fragment = tsCodeFragment('foo()');

    expect(() => {
      expect(fragment).toIncludeImport('z', 'zod');
    }).toThrow();
  });

  it('fails when import name is present but from wrong module', () => {
    const fragment = tsCodeFragment(
      'foo()',
      tsImportBuilder(['z']).from('zodiac'),
    );

    expect(() => {
      expect(fragment).toIncludeImport('z', 'zod');
    }).toThrow();
  });

  it('checks type-only imports when specified', () => {
    const fragment = tsCodeFragment(
      'foo()',
      tsImportBuilder(['MyType']).typeOnly().from('types'),
    );

    expect(fragment).toIncludeImport('MyType', 'types', { isTypeOnly: true });
  });

  it('fails when import is type-only but not expected to be', () => {
    const fragment = tsCodeFragment(
      'foo()',
      tsImportBuilder(['MyType']).typeOnly().from('types'),
    );

    expect(() => {
      expect(fragment).toIncludeImport('MyType', 'types', {
        isTypeOnly: false,
      });
    }).toThrow();
  });

  it('matches import regardless of type-only when not specified', () => {
    const fragment = tsCodeFragment(
      'foo()',
      tsImportBuilder(['MyType']).typeOnly().from('types'),
    );

    expect(fragment).toIncludeImport('MyType', 'types');
  });

  it('supports .not matcher', () => {
    const fragment = tsCodeFragment('foo()');

    expect(fragment).not.toIncludeImport('z', 'zod');
  });

  it('works with multiple imports from same module', () => {
    const fragment = tsCodeFragment(
      'foo()',
      tsImportBuilder(['z', 'ZodSchema', 'ZodError']).from('zod'),
    );

    expect(fragment).toIncludeImport('z', 'zod');
    expect(fragment).toIncludeImport('ZodSchema', 'zod');
    expect(fragment).toIncludeImport('ZodError', 'zod');
  });

  it('works with multiple imports from different modules', () => {
    const fragment = tsCodeFragment('foo()', [
      tsImportBuilder(['z']).from('zod'),
      tsImportBuilder(['Prisma']).from('@prisma/client'),
    ]);

    expect(fragment).toIncludeImport('z', 'zod');
    expect(fragment).toIncludeImport('Prisma', '@prisma/client');
  });
});
