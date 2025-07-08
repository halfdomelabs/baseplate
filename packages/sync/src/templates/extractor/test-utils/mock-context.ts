import type { Logger } from '#src/utils/evented-logger.js';

import { createTestLogger } from '#src/tests/logger.test-utils.js';

import {
  TemplateExtractorConfigLookup,
  TemplateExtractorContext,
  TemplateExtractorFileContainer,
} from '../index.js';

/**
 * Creates a mock TemplateExtractorContext for testing plugins
 */
export async function createMockContext(
  options: {
    outputDirectory?: string;
    packageMap?: Map<string, string>;
    plugins?: Map<string, unknown>;
    logger?: Logger;
  } = {},
): Promise<TemplateExtractorContext> {
  const {
    outputDirectory = '/test-output',
    packageMap = new Map<string, string>(),
    plugins = new Map(),
    logger = createTestLogger(),
  } = options;

  const configLookup = new TemplateExtractorConfigLookup(packageMap);
  const fileContainer = new TemplateExtractorFileContainer([
    ...packageMap.values(),
  ] as string[]);

  // Initialize the config lookup
  await configLookup.initialize();

  return new TemplateExtractorContext({
    configLookup,
    outputDirectory,
    plugins: plugins as Map<string, unknown>,
    fileContainer,
    logger,
  });
}

/**
 * Helper to add extractor config to a mock context
 * This bypasses the normal initialization flow and directly adds to the cache
 */
export function addMockExtractorConfig(
  context: TemplateExtractorContext,
  generatorName: string,
  config: {
    name: string;
    templates?: Record<string, unknown>;
    extractors?: Record<string, unknown>;
    generatorDirectory?: string;
    packageName?: string;
    packagePath?: string;
  },
): void {
  // Access the private cache directly for testing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
  const configLookup = context.configLookup as any;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  const cache = configLookup.extractorConfigCache as Map<string, any>;

  const [packageName, generatorBaseName] = generatorName.includes('#')
    ? generatorName.split('#')
    : ['test-package', generatorName];

  cache.set(generatorName, {
    config: {
      name: config.name,
      templates: config.templates ?? {},
      extractors: config.extractors ?? {},
    },
    generatorDirectory:
      config.generatorDirectory ?? `/test-generators/${generatorBaseName}`,
    packageName: config.packageName ?? packageName,
    packagePath: config.packagePath ?? `/test-packages/${packageName}`,
  });
}

/**
 * Helper to create mock template path roots metadata
 */
export function createMockPathsMetadata(
  pathRoots: {
    canonicalPath: string;
    pathRootName: string;
  }[],
): string {
  return JSON.stringify(pathRoots);
}
