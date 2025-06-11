/**
 * Test utilities for extractor-v2 plugins
 */

export { createTestFiles } from './file-system-utils.js';

export {
  addMockExtractorConfig,
  createMockContext,
  createMockPathsMetadata,
} from './mock-context.js';

export {
  createMockPluginApi,
  createPluginInstance,
  createPluginInstanceWithDependencies,
} from './plugin-test-utils.js';
