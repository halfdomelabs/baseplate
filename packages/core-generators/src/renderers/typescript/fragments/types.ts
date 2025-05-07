import type { TsImportDeclaration } from '../imports/index.js';

/**
 * Represents a code fragment that will be hoisted to a specific position in the generated file.
 *
 * Hoisted fragments allow code to be placed at strategic locations in the file
 * (currently supporting placement after import declarations), which is useful for
 * type declarations, utility functions, or constants that need to be available
 * throughout the file.
 */
export interface TsHoistedFragment {
  /**
   * Unique identifier for this hoisted fragment.
   * Used for deduplication when multiple fragments with the same key are provided.
   */
  key: string;

  /**
   * The actual code fragment to be hoisted to the specified position.
   */
  fragment: TsCodeFragment;
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
   * Additional code fragments that should be hoisted to specific positions in the file.
   * These fragments are collected and positioned according to their specified position.
   */
  hoistedFragments?: TsHoistedFragment[];
}
