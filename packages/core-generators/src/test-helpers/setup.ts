/**
 * Auto-setup file for test helpers
 *
 * This file automatically extends Vitest matchers and snapshot serializers when imported.
 * Add this to your vitest.config.ts setupFiles to enable custom matchers and serializers globally.
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
import { extendFragmentSerializer } from './snapshot-serializer.js';

// Automatically extend matchers and serializers when this file is imported
extendFragmentMatchers();
extendFragmentSerializer();
