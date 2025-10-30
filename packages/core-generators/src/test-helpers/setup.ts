/**
 * Auto-setup file for test helpers
 *
 * This file automatically extends Vitest matchers when imported.
 * Add this to your vitest.config.ts setupFiles to enable custom matchers globally.
 *
 * @example
 * ```typescript
 * // vitest.config.ts
 * export default defineConfig({
 *   test: {
 *     setupFiles: ['@baseplate-dev/core-generators/test-helpers/setup']
 *   }
 * });
 * ```
 */

import { extendFragmentMatchers } from './matchers.js';

// Automatically extend matchers when this file is imported
extendFragmentMatchers();
