import { describe, expect, it, vi } from 'vitest';

import { createTestLogger } from '#src/tests/logger.test-utils.js';

import type {
  TemplateExtractorPlugin,
  TemplateExtractorPluginApi,
} from './template-extractor-plugin.js';
import type { TemplateFileExtractor } from './template-file-extractor.js';

import { TemplateExtractorConfigLookup } from '../configs/index.js';
import { initializeTemplateExtractorPlugins } from './initialize-template-extractor-plugins.js';
import { TemplateExtractorContext } from './template-extractor-context.js';
import { TemplateExtractorFileContainer } from './template-extractor-file-container.js';

describe('initializeTemplateExtractorPlugins', () => {
  const createMockContext = (): TemplateExtractorContext =>
    new TemplateExtractorContext({
      configLookup: new TemplateExtractorConfigLookup(new Map()),
      logger: createTestLogger(),
      outputDirectory: '/test',
      plugins: new Map(),
    });

  const createMockFileContainer = (): TemplateExtractorFileContainer =>
    new TemplateExtractorFileContainer();

  const createMockPlugin = (
    name: string,
    dependencies: TemplateExtractorPlugin[] = [],
    instance?: unknown,
  ): TemplateExtractorPlugin => ({
    name,
    pluginDependencies: dependencies,
    getInstance: vi.fn().mockReturnValue(instance ?? { name }),
  });

  const createMockExtractor = (
    name: string,
    plugins: TemplateExtractorPlugin[] = [],
  ): TemplateFileExtractor => ({
    name,
    pluginDependencies: plugins,
    extractTemplateMetadataEntries: vi.fn(),
    writeTemplateFiles: vi.fn(),
  });

  it('should initialize plugins with no dependencies', async () => {
    const pluginA = createMockPlugin('pluginA', [], { data: 'A' });
    const pluginB = createMockPlugin('pluginB', [], { data: 'B' });

    const extractor = createMockExtractor('extractor', [pluginA, pluginB]);
    const context = createMockContext();
    const fileContainer = createMockFileContainer();

    const result = await initializeTemplateExtractorPlugins({
      templateExtractors: [extractor],
      context,
      fileContainer,
    });

    expect(result.pluginMap.size).toBe(2);
    expect(result.pluginMap.get('pluginA')).toEqual({ data: 'A' });
    expect(result.pluginMap.get('pluginB')).toEqual({ data: 'B' });
    expect(result.hooks.afterExtract).toEqual([]);
    expect(result.hooks.afterWrite).toEqual([]);
  });

  it('should initialize plugins in dependency order', async () => {
    const pluginA = createMockPlugin('pluginA', [], { data: 'A' });
    const pluginB = createMockPlugin('pluginB', [pluginA], { data: 'B' });
    const pluginC = createMockPlugin('pluginC', [pluginB], { data: 'C' });

    const extractor = createMockExtractor('extractor', [
      pluginC,
      pluginA,
      pluginB,
    ]);
    const context = createMockContext();
    const fileContainer = createMockFileContainer();

    const initOrder: string[] = [];
    pluginA.getInstance = vi.fn(() => {
      initOrder.push('pluginA');
      return { data: 'A' };
    });
    pluginB.getInstance = vi.fn(() => {
      initOrder.push('pluginB');
      return { data: 'B' };
    });
    pluginC.getInstance = vi.fn(() => {
      initOrder.push('pluginC');
      return { data: 'C' };
    });

    const result = await initializeTemplateExtractorPlugins({
      templateExtractors: [extractor],
      context,
      fileContainer,
    });

    expect(result.pluginMap.size).toBe(3);
    expect(initOrder).toEqual(['pluginA', 'pluginB', 'pluginC']);
  });

  it('should extract plugins recursively from nested dependencies', async () => {
    const pluginA = createMockPlugin('pluginA', [], { data: 'A' });
    const pluginB = createMockPlugin('pluginB', [pluginA], { data: 'B' });
    const pluginC = createMockPlugin('pluginC', [], { data: 'C' });

    // Only specify pluginB in extractor, but pluginA should be included via dependency
    const extractor = createMockExtractor('extractor', [pluginB, pluginC]);
    const context = createMockContext();
    const fileContainer = createMockFileContainer();

    const result = await initializeTemplateExtractorPlugins({
      templateExtractors: [extractor],
      context,
      fileContainer,
    });

    expect(result.pluginMap.size).toBe(3);
    expect(result.pluginMap.has('pluginA')).toBe(true);
    expect(result.pluginMap.has('pluginB')).toBe(true);
    expect(result.pluginMap.has('pluginC')).toBe(true);
  });

  it('should handle multiple extractors with overlapping plugins', async () => {
    const pluginA = createMockPlugin('pluginA', [], { data: 'A' });
    const pluginB = createMockPlugin('pluginB', [], { data: 'B' });

    const extractor1 = createMockExtractor('extractor1', [pluginA]);
    const extractor2 = createMockExtractor('extractor2', [pluginA, pluginB]);
    const context = createMockContext();
    const fileContainer = createMockFileContainer();

    const result = await initializeTemplateExtractorPlugins({
      templateExtractors: [extractor1, extractor2],
      context,
      fileContainer,
    });

    expect(result.pluginMap.size).toBe(2);
  });

  it('should populate context plugins map as plugins are initialized', async () => {
    const pluginA = createMockPlugin('pluginA', [], { data: 'A' });
    const pluginB = createMockPlugin('pluginB', [pluginA], { data: 'B' });

    const extractor = createMockExtractor('extractor', [pluginB]);
    const context = createMockContext();
    const fileContainer = createMockFileContainer();

    // Mock pluginB to verify it can access pluginA via context
    pluginB.getInstance = vi.fn(
      (options: {
        context: TemplateExtractorContext;
        fileContainer: TemplateExtractorFileContainer;
        api: TemplateExtractorPluginApi;
      }) => {
        // pluginA should be available when pluginB is being initialized
        expect(options.context.plugins.has('pluginA')).toBe(true);
        return { data: 'B' };
      },
    );

    const result = await initializeTemplateExtractorPlugins({
      templateExtractors: [extractor],
      context,
      fileContainer,
    });

    expect(result.pluginMap.size).toBe(2);
    expect(context.plugins.size).toBe(2);
    expect(context.plugins.has('pluginA')).toBe(true);
    expect(context.plugins.has('pluginB')).toBe(true);
  });

  it('should handle empty plugin list', async () => {
    const extractor = createMockExtractor('extractor', []);
    const context = createMockContext();
    const fileContainer = createMockFileContainer();

    const result = await initializeTemplateExtractorPlugins({
      templateExtractors: [extractor],
      context,
      fileContainer,
    });

    expect(result.pluginMap.size).toBe(0);
  });

  it('should collect hooks from plugins', async () => {
    const afterExtractHook = vi.fn();
    const afterWriteHook = vi.fn();

    const plugin = createMockPlugin('plugin', [], { data: 'A' });
    plugin.getInstance = vi.fn(
      (options: {
        context: TemplateExtractorContext;
        fileContainer: TemplateExtractorFileContainer;
        api: TemplateExtractorPluginApi;
      }) => {
        // Register hooks when plugin is initialized
        options.api.registerHook('afterExtract', afterExtractHook);
        options.api.registerHook('afterWrite', afterWriteHook);
        return { data: 'A' };
      },
    );

    const extractor = createMockExtractor('extractor', [plugin]);
    const context = createMockContext();
    const fileContainer = createMockFileContainer();

    const result = await initializeTemplateExtractorPlugins({
      templateExtractors: [extractor],
      context,
      fileContainer,
    });

    expect(result.hooks.afterExtract).toHaveLength(1);
    expect(result.hooks.afterWrite).toHaveLength(1);
    expect(result.hooks.afterExtract[0]).toBe(afterExtractHook);
    expect(result.hooks.afterWrite[0]).toBe(afterWriteHook);
  });

  it('should handle async getInstance methods', async () => {
    const pluginA = createMockPlugin('pluginA', [], { data: 'A' });
    const pluginB = createMockPlugin('pluginB', [pluginA], { data: 'B' });

    // Make pluginA async
    pluginA.getInstance = vi.fn(async () => {
      // Simulate async work
      await new Promise((resolve) => setTimeout(resolve, 1));
      return { data: 'A', isAsync: true };
    });

    // Make pluginB async too
    pluginB.getInstance = vi.fn(
      async (options: {
        context: TemplateExtractorContext;
        fileContainer: TemplateExtractorFileContainer;
        api: TemplateExtractorPluginApi;
      }) => {
        // Verify pluginA is available even though it was async
        expect(options.context.plugins.has('pluginA')).toBe(true);
        await new Promise((resolve) => setTimeout(resolve, 1));
        return { data: 'B', isAsync: true };
      },
    );

    const extractor = createMockExtractor('extractor', [pluginB]);
    const context = createMockContext();
    const fileContainer = createMockFileContainer();

    const result = await initializeTemplateExtractorPlugins({
      templateExtractors: [extractor],
      context,
      fileContainer,
    });

    expect(result.pluginMap.size).toBe(2);
    expect(result.pluginMap.get('pluginA')).toEqual({
      data: 'A',
      isAsync: true,
    });
    expect(result.pluginMap.get('pluginB')).toEqual({
      data: 'B',
      isAsync: true,
    });
  });
});
