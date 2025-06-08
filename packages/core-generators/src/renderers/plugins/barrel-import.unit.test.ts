import { describe, expect, it } from 'vitest';

import { mergeBarrelExports } from './barrel-import.js';

describe('mergeBarrelExports', () => {
  it('should merge and sort exports', () => {
    // Arrange
    const indexFileContents = `
export { foo } from './foo';
export { bar } from './bar';
export * from './baz';
`;

    const barrelExports = [
      { moduleSpecifier: './bar', namedExports: ['qux', 'quux'] },
      { moduleSpecifier: './foo', namedExports: ['baz'] },
      { moduleSpecifier: './baz', namedExports: ['*'] },
    ];

    // Act
    const result = mergeBarrelExports(indexFileContents, barrelExports);

    // Assert
    expect(result).toMatchInlineSnapshot(`
      "export * from './baz';
      export { quux, qux } from './bar';
      export { baz } from './foo';
      "
    `);
  });

  it('should handle empty exports', () => {
    // Arrange
    const indexFileContents = '';
    const barrelExports: { moduleSpecifier: string; namedExports: string[] }[] =
      [];

    // Act
    const result = mergeBarrelExports(indexFileContents, barrelExports);

    // Assert
    expect(result).toBe('');
  });

  it('should handle duplicate exports', () => {
    // Arrange
    const indexFileContents = '';
    const barrelExports = [
      { moduleSpecifier: './foo', namedExports: ['bar', 'baz'] },
      { moduleSpecifier: './foo', namedExports: ['qux', 'bar'] },
    ];

    // Act
    const result = mergeBarrelExports(indexFileContents, barrelExports);

    // Assert
    expect(result).toMatchInlineSnapshot(`
      "export { bar, baz, qux } from './foo';
      "
    `);
  });

  it('should handle type-only exports', () => {
    // Arrange
    const indexFileContents = '';
    const barrelExports = [
      {
        moduleSpecifier: './types',
        namedExports: ['TypeA', 'TypeB'],
        isTypeOnly: true,
      },
      { moduleSpecifier: './utils', namedExports: ['funcA', 'funcB'] },
      { moduleSpecifier: './types', namedExports: ['funcC'] },
    ];

    // Act
    const result = mergeBarrelExports(indexFileContents, barrelExports);

    // Assert
    expect(result).toMatchInlineSnapshot(`
      "export type { TypeA, TypeB } from './types';
      export { funcC } from './types';
      export { funcA, funcB } from './utils';
      "
    `);
  });

  it('should handle type-only star exports', () => {
    // Arrange
    const indexFileContents = '';
    const barrelExports = [
      { moduleSpecifier: './types', namedExports: ['*'], isTypeOnly: true },
      { moduleSpecifier: './utils', namedExports: ['funcA'] },
    ];

    // Act
    const result = mergeBarrelExports(indexFileContents, barrelExports);

    // Assert
    expect(result).toMatchInlineSnapshot(`
      "export type * from './types';
      export { funcA } from './utils';
      "
    `);
  });
});
