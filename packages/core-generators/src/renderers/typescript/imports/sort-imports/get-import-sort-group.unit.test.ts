import { describe, expect, it } from 'vitest';

import type { TsImportDeclaration } from '../types.js';

import { getImportSortGroup } from './get-import-sort-group.js';

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
    moduleSpecifier: source,
    isTypeOnly,
    defaultImport,
    namespaceImport,
    namedImports: namedImports.map((name) => ({ name })),
  };
}

describe('getImportSortGroup', () => {
  // Test for built-in modules
  describe('Built-in modules', () => {
    it('should classify Node.js built-in modules as "builtin"', () => {
      const importDecl = createImportDeclaration('fs', {
        namedImports: ['readFileSync'],
      });
      expect(getImportSortGroup(importDecl)).toBe('builtin');
    });

    it('should classify Node.js namespaced built-in modules as "builtin"', () => {
      const importDecl = createImportDeclaration('node:fs', {
        namedImports: ['readFileSync'],
      });
      expect(getImportSortGroup(importDecl)).toBe('builtin');
    });

    it('should classify built-in type-only imports as "builtin-type"', () => {
      const importDecl = createImportDeclaration('fs', {
        isTypeOnly: true,
        namedImports: ['Stats'],
      });
      expect(getImportSortGroup(importDecl)).toBe('builtin-type');
    });
  });

  // Test for external modules
  describe('External modules', () => {
    it('should classify external package imports as "external"', () => {
      const importDecl = createImportDeclaration('lodash', {
        namedImports: ['debounce'],
      });
      expect(getImportSortGroup(importDecl)).toBe('external');
    });

    it('should classify external scoped package imports as "external"', () => {
      const importDecl = createImportDeclaration('@testing-library/react', {
        namedImports: ['render'],
      });
      expect(getImportSortGroup(importDecl)).toBe('external');
    });

    it('should classify external type-only imports as "external-type"', () => {
      const importDecl = createImportDeclaration('react', {
        isTypeOnly: true,
        namedImports: ['FC', 'ReactNode'],
      });
      expect(getImportSortGroup(importDecl)).toBe('external-type');
    });
  });

  // Test for internal modules
  describe('Internal modules', () => {
    it('should classify internal modules as "internal" based on patterns', () => {
      const importDecl = createImportDeclaration('@internal/utils', {
        namedImports: ['formatDate'],
      });
      expect(
        getImportSortGroup(importDecl, {
          internalPatterns: [/^@internal\//],
        }),
      ).toBe('internal');
    });

    it('should classify internal type-only imports as "internal-type"', () => {
      const importDecl = createImportDeclaration('@internal/types', {
        isTypeOnly: true,
        namedImports: ['User'],
      });
      expect(
        getImportSortGroup(importDecl, {
          internalPatterns: [/^@internal\//],
        }),
      ).toBe('internal-type');
    });
  });

  // Test for parent directory imports
  describe('Parent directory imports', () => {
    it('should classify parent directory imports as "parent"', () => {
      const importDecl = createImportDeclaration('../utils', {
        namedImports: ['formatDate'],
      });
      expect(getImportSortGroup(importDecl)).toBe('parent');
    });

    it('should classify deeper parent directory imports as "parent"', () => {
      const importDecl = createImportDeclaration('../../../utils', {
        namedImports: ['formatDate'],
      });
      expect(getImportSortGroup(importDecl)).toBe('parent');
    });

    it('should classify parent directory type-only imports as "parent-type"', () => {
      const importDecl = createImportDeclaration('../types', {
        isTypeOnly: true,
        namedImports: ['User'],
      });
      expect(getImportSortGroup(importDecl)).toBe('parent-type');
    });
  });

  // Test for sibling imports
  describe('Sibling imports', () => {
    it('should classify sibling imports as "sibling"', () => {
      const importDecl = createImportDeclaration('./utils', {
        namedImports: ['formatDate'],
      });
      expect(getImportSortGroup(importDecl)).toBe('sibling');
    });

    it('should classify sibling file imports as "sibling"', () => {
      const importDecl = createImportDeclaration('./formatter.js', {
        defaultImport: 'formatter',
      });
      expect(getImportSortGroup(importDecl)).toBe('sibling');
    });

    it('should classify sibling type-only imports as "sibling-type"', () => {
      const importDecl = createImportDeclaration('./types', {
        isTypeOnly: true,
        namedImports: ['User'],
      });
      expect(getImportSortGroup(importDecl)).toBe('sibling-type');
    });
  });

  // Test for index imports
  describe('Index imports', () => {
    it('should classify "./" as "index"', () => {
      const importDecl = createImportDeclaration('./', {
        namedImports: ['formatDate'],
      });
      expect(getImportSortGroup(importDecl)).toBe('index');
    });

    it('should classify "." as "index"', () => {
      const importDecl = createImportDeclaration('.', {
        defaultImport: 'app',
      });
      expect(getImportSortGroup(importDecl)).toBe('index');
    });

    it('should classify "./index.js" as "index"', () => {
      const importDecl = createImportDeclaration('./index.js', {
        namedImports: ['formatDate'],
      });
      expect(getImportSortGroup(importDecl)).toBe('index');
    });

    it('should classify index type-only imports as "index-type"', () => {
      const importDecl = createImportDeclaration('./index', {
        isTypeOnly: true,
        namedImports: ['User'],
      });
      expect(getImportSortGroup(importDecl)).toBe('index-type');
    });
  });

  // Test for style imports
  describe('Style imports', () => {
    it('should classify CSS imports as "style"', () => {
      const importDecl = createImportDeclaration('./styles.css', {
        namedImports: ['className'],
      });
      expect(getImportSortGroup(importDecl)).toBe('style');
    });

    it('should classify SCSS imports as "style"', () => {
      const importDecl = createImportDeclaration('./styles.scss', {
        defaultImport: 'styles',
      });
      expect(getImportSortGroup(importDecl)).toBe('style');
    });

    it('should classify style imports with query parameters as "style"', () => {
      const importDecl = createImportDeclaration('./styles.css?modules', {
        defaultImport: 'styles',
      });
      expect(getImportSortGroup(importDecl)).toBe('style');
    });

    it('should use custom style extensions if provided', () => {
      const importDecl = createImportDeclaration('./file.custom', {
        defaultImport: 'styles',
      });
      expect(
        getImportSortGroup(importDecl, {
          styleExtensions: ['.custom'],
        }),
      ).toBe('style');
    });
  });

  // Test for side effect imports
  describe('Side effect imports', () => {
    it('should classify imports without specifiers as "side-effect"', () => {
      const importDecl = createImportDeclaration('./setup');
      expect(getImportSortGroup(importDecl)).toBe('side-effect');
    });

    it('should classify style imports without specifiers as "side-effect-style"', () => {
      const importDecl = createImportDeclaration('./styles.css');
      expect(getImportSortGroup(importDecl)).toBe('side-effect-style');
    });
  });

  // Test unknown imports
  describe('Unknown imports', () => {
    it('should classify non-matching type imports as "type"', () => {
      const importDecl = createImportDeclaration('/absolute/path', {
        isTypeOnly: true,
        namedImports: ['something'],
      });
      expect(getImportSortGroup(importDecl)).toBe('type');
    });

    it('should classify non-matching imports as "unknown"', () => {
      const importDecl = createImportDeclaration('/absolute/path', {
        namedImports: ['something'],
      });
      expect(getImportSortGroup(importDecl)).toBe('unknown');
    });
  });

  // Test for allowedSortGroups option
  describe('Allowed sort groups', () => {
    it('should respect allowedSortGroups and fall back to unknown when group is not allowed', () => {
      const importDecl = createImportDeclaration('fs', {
        namedImports: ['readFileSync'],
      });
      expect(
        getImportSortGroup(importDecl, {
          allowedSortGroups: ['external', 'unknown'],
        }),
      ).toBe('unknown');
    });

    it('should use allowed group when it matches', () => {
      const importDecl = createImportDeclaration('lodash', {
        namedImports: ['debounce'],
      });
      expect(
        getImportSortGroup(importDecl, {
          allowedSortGroups: ['external', 'unknown'],
        }),
      ).toBe('external');
    });

    it('should fall back to normal imports when type groups are not allowed', () => {
      const importDecl = createImportDeclaration('react', {
        isTypeOnly: true,
        namedImports: ['FC'],
      });
      expect(
        getImportSortGroup(importDecl, {
          allowedSortGroups: ['external', 'unknown'],
        }),
      ).toBe('external');
    });

    it('should respect multiple allowed groups in priority order', () => {
      const importDecl = createImportDeclaration('./styles.css');

      // When side-effect-style is not allowed but side-effect is, should use side-effect
      expect(
        getImportSortGroup(importDecl, {
          allowedSortGroups: ['style', 'side-effect', 'unknown'],
        }),
      ).toBe('side-effect');

      // When neither side-effect nor side-effect-style is allowed but style is, should use style
      expect(
        getImportSortGroup(importDecl, {
          allowedSortGroups: ['style', 'unknown'],
        }),
      ).toBe('style');
    });

    it('should always allow unknown group as fallback', () => {
      const importDecl = createImportDeclaration('lodash', {
        namedImports: ['debounce'],
      });
      // Even with empty allowed groups, unknown should be available
      expect(
        getImportSortGroup(importDecl, {
          allowedSortGroups: [],
        }),
      ).toBe('unknown');
    });
  });
});
