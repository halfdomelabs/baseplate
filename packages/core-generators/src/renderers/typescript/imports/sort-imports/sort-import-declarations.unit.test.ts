import { describe, expect, it } from 'vitest';

import type { TsImportDeclaration } from '../types.js';

import { sortImportDeclarations } from './sort-import-declarations.js';

// Helper function to create import declarations for testing
function createImportDeclaration(
  source: string,
  {
    isTypeOnly = false,
    defaultImport = undefined,
    namespaceImport = undefined,
    namedImports = [],
  }: {
    isTypeOnly?: boolean;
    defaultImport?: string;
    namespaceImport?: string;
    namedImports?: string[];
  } = {},
): TsImportDeclaration {
  return {
    source,
    isTypeOnly,
    defaultImport,
    namespaceImport,
    namedImports: namedImports.map((name) => ({ name })),
  };
}

describe('sortImportDeclarations', () => {
  it('should sort imports according to default group order', () => {
    const styleImport = createImportDeclaration('./styles.css');
    const reactImport = createImportDeclaration('react', {
      defaultImport: 'React',
    });
    const fsImport = createImportDeclaration('fs', {
      namedImports: ['readFileSync'],
    });
    const utilsImport = createImportDeclaration('./utils', {
      namedImports: ['formatDate'],
    });
    const internalImport = createImportDeclaration('@internal/utils', {
      namedImports: ['helper'],
    });
    const typeOnlyImport = createImportDeclaration('type-only', {
      isTypeOnly: true,
      namedImports: ['Type'],
    });

    const imports: TsImportDeclaration[] = [
      styleImport,
      reactImport,
      fsImport,
      utilsImport,
      internalImport,
      typeOnlyImport,
    ];

    const sorted = sortImportDeclarations(imports, {
      internalPatterns: [/^@internal\//],
    });

    expect(sorted).toEqual([
      [typeOnlyImport],
      [fsImport, reactImport],
      [internalImport],
      [utilsImport],
      [styleImport],
    ]);
  });

  it('should preserve order of side effect imports within groups', () => {
    const imports: TsImportDeclaration[] = [
      createImportDeclaration('./style3.css'),
      createImportDeclaration('./style1.css'),
      createImportDeclaration('./style3.css'),
    ];

    const sorted = sortImportDeclarations(imports);

    expect(sorted[0].map((i) => i.source)).toEqual([
      './style3.css',
      './style1.css',
      './style3.css',
    ]);
  });

  it('should sort imports case-insensitively by default', () => {
    const imports: TsImportDeclaration[] = [
      createImportDeclaration('Alpha', { defaultImport: 'main' }),
      createImportDeclaration('beta', { defaultImport: 'main' }),
      createImportDeclaration('Gamma', { defaultImport: 'main' }),
    ];

    const sorted = sortImportDeclarations(imports, { ignoreCase: false });

    expect(sorted[0].map((i) => i.source)).toEqual(['Alpha', 'Gamma', 'beta']);
  });

  it('should respect case when ignoreCase is false', () => {
    const imports: TsImportDeclaration[] = [
      createImportDeclaration('Zebra'),
      createImportDeclaration('alpha'),
      createImportDeclaration('beta'),
    ];

    const sorted = sortImportDeclarations(imports, { ignoreCase: false });

    expect(sorted[0].map((i) => i.source)).toEqual(['Zebra', 'alpha', 'beta']);
  });

  it('should handle custom group configurations', () => {
    const imports: TsImportDeclaration[] = [
      createImportDeclaration('react'),
      createImportDeclaration('./local'),
      createImportDeclaration('fs'),
    ];

    const sorted = sortImportDeclarations(imports, {
      groups: ['sibling', ['builtin', 'external']],
    });

    expect(sorted[0][0].source).toBe('./local');
    expect(sorted[1].map((i) => i.source)).toEqual(['fs', 'react']);
  });

  it('should handle empty import arrays', () => {
    const sorted = sortImportDeclarations([]);
    expect(sorted).toEqual([]);
  });
});
