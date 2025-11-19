import type { TsCodeFragment } from '#src/renderers/typescript/index.js';

import type {
  ToIncludeImportOptions,
  ToMatchTsFragmentOptions,
} from './matchers.ts';

/**
 * TypeScript module augmentation for custom matchers
 * This provides type checking and autocomplete for the custom matchers
 */
interface FragmentMatchers<R = unknown> {
  /**
   * Asserts that a TypeScript fragment matches the expected fragment
   * Compares contents, imports (order-independent), and optionally hoisted fragments
   */
  toMatchTsFragment(
    expected: TsCodeFragment,
    options?: ToMatchTsFragmentOptions,
  ): R;
  /**
   * Asserts that a fragment includes a specific import
   */
  toIncludeImport(
    name: string,
    from: string,
    options?: ToIncludeImportOptions,
  ): R;
}

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
  interface Matchers<T = any> extends FragmentMatchers<T> {}
}
