import { describe, expect, it } from 'vitest';

import { createTsImportMapSchema } from '../renderers/typescript/import-maps/ts-import-map.js';
import { createTestTsImportMap } from './import-map-helpers.js';

describe('createTestTsImportMap', () => {
  it('creates import map with name-based module specifiers', () => {
    const schema = createTsImportMapSchema({
      scalarField: {},
      relationHelpers: {},
    });

    const importMap = createTestTsImportMap(schema, 'data-utils');

    // Check that the import map has the expected keys
    expect(importMap).toHaveProperty('scalarField');
    expect(importMap).toHaveProperty('relationHelpers');

    // Check that imports use name-based module specifiers
    expect(importMap.scalarField.moduleSpecifier).toBe(
      'data-utils/scalarField',
    );
    expect(importMap.relationHelpers.moduleSpecifier).toBe(
      'data-utils/relationHelpers',
    );
  });

  it('creates consistent module specifiers for all keys', () => {
    const schema = createTsImportMapSchema({
      scalarField: {},
      relationHelpers: {},
      $Enums: {},
    });

    const importMap = createTestTsImportMap(schema, 'test-module');

    expect(importMap.scalarField.moduleSpecifier).toBe(
      'test-module/scalarField',
    );
    expect(importMap.$Enums.moduleSpecifier).toBe('test-module/$Enums');
    expect(importMap.relationHelpers.moduleSpecifier).toBe(
      'test-module/relationHelpers',
    );
  });

  it('creates fragments that can be used in code generation', () => {
    const schema = createTsImportMapSchema({
      scalarField: {},
    });

    const importMap = createTestTsImportMap(schema, 'data-utils');

    const fragment = importMap.scalarField.fragment();

    expect(fragment.contents).toBe('scalarField');
    expect(fragment.imports).toHaveLength(1);
    expect(fragment.imports?.[0].moduleSpecifier).toBe(
      'data-utils/scalarField',
    );
    expect(fragment.imports?.[0].namedImports).toEqual([
      { name: 'scalarField' },
    ]);
  });

  it('handles type-only imports correctly', () => {
    const schema = createTsImportMapSchema({
      MyType: { isTypeOnly: true },
    });

    const importMap = createTestTsImportMap(schema, 'types');

    const fragment = importMap.MyType.typeFragment();

    expect(fragment.imports).toHaveLength(1);
    expect(fragment.imports?.[0].isTypeOnly).toBe(true);
    expect(fragment.imports?.[0].moduleSpecifier).toBe('types/MyType');
  });

  it('handles wildcard exports', () => {
    const schema = createTsImportMapSchema({
      '*': {},
    });

    const importMap = createTestTsImportMap(schema, 'wildcard-module');

    expect(importMap['*'].moduleSpecifier).toBe('wildcard-module/*');
  });

  it('handles exported aliases', () => {
    const schema = createTsImportMapSchema({
      defaultExport: { exportedAs: 'default' },
    });

    const importMap = createTestTsImportMap(schema, 'my-module');

    const declaration = importMap.defaultExport.declaration();

    expect(declaration.defaultImport).toBe('defaultExport');
    expect(declaration.moduleSpecifier).toBe('my-module/defaultExport');
  });
});
