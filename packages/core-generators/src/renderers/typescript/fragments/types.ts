import type { TsImportDeclaration } from '../imports/index.js';

/**
 * A code fragment that has a key.
 */
export interface TsKeyedFragment extends TsCodeFragment {
  /**
   * The key of the fragment.
   */
  key: string;
}

/**
 * Represents a code fragment that will be hoisted to a specific position in the generated file.
 *
 * Hoisted fragments allow code to be placed outside of the main code block, which is useful for
 * type declarations, utility functions, or constants that need to be available in the module scope.
 *
 * They also support deduplication, so if multiple fragments with the same key are provided,
 * they will be deduplicated. However, if any of the fragments have different contents, an error
 * will be thrown.
 */
export interface TsHoistedFragment extends TsKeyedFragment {
  /**
   * Unique identifier for this hoisted fragment used for deduplication and ordering
   * (fragments are ordered by topological sort and then alphabetically by key).
   */
  key: string;
}

/**
 * The position where a hoisted fragment should be placed in the generated file.
 */
export type TsHoistedFragmentPosition = 'beforeImports' | 'afterImports';

/**
 * A hoisted fragment with a specific position in the generated file, e.g.
 * before imports or after imports.
 */
export interface TsPositionedHoistedFragment extends TsHoistedFragment {
  /**
   * Position where this fragment should be placed in the generated file.
   */
  position: TsHoistedFragmentPosition;
}

/**
 * Represents a piece of TypeScript code with its imports and related fragments.
 *
 * A code fragment is the basic unit of code generation in the TypeScript rendering system.
 * It contains the actual code content along with any imports it requires and
 * any additional fragments that should be hoisted to specific positions in the file.
 */
export interface TsCodeFragment {
  /**
   * The actual TypeScript code as a string.
   */
  contents: string;

  /**
   * Import declarations that this code fragment requires.
   * These imports will be collected and placed at the top of the generated file.
   */
  imports?: TsImportDeclaration[];

  /**
   * Additional code fragments that should be hoisted outside the current code block.
   * These fragments are collected and placed in the module scope.
   */
  hoistedFragments?: TsHoistedFragment[];
}
