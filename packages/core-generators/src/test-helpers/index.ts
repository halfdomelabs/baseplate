/**
 * Test helpers for @baseplate-dev/core-generators
 *
 * This module provides utilities for testing code generators, including:
 * - Custom Vitest matchers for TypeScript fragments
 * - Utilities for creating mock import providers
 * - Fragment comparison functions
 *
 * @example
 * ```typescript
 * import { createTestTsImportMap, extendFragmentMatchers } from '@baseplate-dev/core-generators/test-helpers';
 *
 * // Extend Vitest matchers (call once in setup)
 * extendFragmentMatchers();
 *
 * // Create mock import providers for testing
 * const imports = createTestTsImportMap(schema);
 *
 * // Use custom matchers in tests
 * expect(fragment).toMatchTsFragment(expectedFragment);
 * expect(fragment).toIncludeImport('z', 'zod');
 * ```
 *
 * @packageDocumentation
 */

// Export import map helpers
export { createTestTsImportMap } from './import-map-helpers.js';

// Export matcher functions and types
export {
  extendFragmentMatchers,
  fragmentMatchers,
  type FragmentMatchers,
  type ToIncludeImportOptions,
  type ToMatchTsFragmentOptions,
} from './matchers.js';

// Export snapshot serializer
export {
  extendFragmentSerializer,
  tsFragmentSerializer,
} from './snapshot-serializer.js';

// Export utility functions
export {
  areFragmentsEqual,
  type CompareFragmentsOptions,
  normalizeFragment,
} from './utils.js';
