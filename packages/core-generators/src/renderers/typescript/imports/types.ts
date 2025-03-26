/**
 * Represents a named import
 */
export interface TsNamedImport {
  /**
   * Name of the import
   */
  name: string;
  /**
   * Optional alias for the import
   */
  alias?: string;
  /**
   * Whether the import is a type-only import
   */
  isTypeOnly?: boolean;
}

/**
 * Represents a single import declaration
 */
export interface TsImportDeclaration {
  /**
   * The module specifier for the import
   */
  source: string;
  /**
   * Whether the import is a type-only import
   */
  isTypeOnly?: boolean;
  /**
   * The namespace import, e.g. `* as React`
   */
  namespaceImport?: string;
  /**
   * The default import, e.g. `import React from 'react'`
   */
  defaultImport?: string;
  /**
   * The named imports, e.g. `import { React } from 'react'`
   */
  namedImports?: TsNamedImport[];
}

/**
 * Represents a mapping entry for TypeScript path aliases.
 * Used to convert a path alias to a project directory location with their baseUrl included.
 *
 * Only final * is accepted
 *
 * @example
 * For tsconfig.json:
 * ```json
 * {
 *   "baseUrl": "./src",
 *   "paths": {
 *     "@src/*": ["./*"]
 *   }
 * }
 * ```
 * The corresponding PathMapEntry would be:
 * ```ts
 * {
 *   from: "@src/*",
 *   to: "./src/*"
 * }
 * ```
 */
export interface TsPathMapEntry {
  /** The alias to map from (e.g. "@src/*") */
  from: string;
  /** The project relative path to map to (e.g. "./src/app/*") */
  to: string;
}
