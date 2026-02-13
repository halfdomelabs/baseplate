import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { ExtractorConfig } from './index.js';

import { TemplateExtractorConfigLookup } from './template-extractor-config-lookup.js';

// Mock the indexTemplateConfigs utility
vi.mock('../utils/index-template-configs.js', () => ({
  indexTemplateConfigs: vi.fn(),
}));

describe('TemplateExtractorConfigLookup - Cache and Lookup Behavior', () => {
  const mockPackageMap = new Map([
    ['@test/package1', '/packages/package1'],
    ['@test/package2', '/packages/package2'],
  ]);

  // Mock data that would be returned by indexTemplateConfigs
  const mockExtractorEntries = [
    {
      generatorName: '@test/package1#test-generator',
      config: {
        name: 'test-generator',
        templates: {
          template1: { sourceFile: 'template1.ts', type: 'ts' },
          template2: { sourceFile: 'template2.ts', type: 'ts' },
        },
        extractors: {
          ts: { includeComments: true },
        },
        plugins: {
          'test-plugin': { enabled: true },
        },
      } as ExtractorConfig,
      generatorDirectory: '/packages/package1/generators/test',
      packageName: '@test/package1',
      packagePath: '/packages/package1',
    },
    {
      generatorName: '@test/package2#other-generator',
      config: {
        name: 'other-generator',
        templates: {
          config: { sourceFile: 'config.ts', type: 'ts' },
        },
      } as ExtractorConfig,
      generatorDirectory: '/packages/package2/generators/other',
      packageName: '@test/package2',
      packagePath: '/packages/package2',
    },
  ];

  const mockProviderEntries = [
    {
      config: { type: 'ts-imports', includeTypes: true },
      packagePathSpecifier: '@test/package1:providers/imports.ts',
      providerName: 'importsProvider',
      packageName: '@test/package1',
      packagePath: '/packages/package1',
    },
    {
      config: { type: 'path', roots: ['/src'] },
      packagePathSpecifier: '@test/package1:providers/paths.ts',
      providerName: 'pathsProvider',
      packageName: '@test/package1',
      packagePath: '/packages/package1',
    },
    {
      config: { type: 'ts-imports', includeTypes: false },
      packagePathSpecifier: '@test/package2:utils.ts',
      providerName: 'utilsImports',
      packageName: '@test/package2',
      packagePath: '/packages/package2',
    },
  ];

  let lookup: TemplateExtractorConfigLookup;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup mock to return our test data
    const { indexTemplateConfigs } =
      await import('../utils/index-template-configs.js');
    vi.mocked(indexTemplateConfigs).mockResolvedValue({
      extractorEntries: mockExtractorEntries,
      providerEntries: mockProviderEntries,
    });

    lookup = new TemplateExtractorConfigLookup(mockPackageMap);
    await lookup.initialize();
  });

  describe('getExtractorConfig', () => {
    it('should return extractor config for existing generator', () => {
      const result = lookup.getExtractorConfig('@test/package1#test-generator');

      expect(result).toBeDefined();
      expect(result?.config.name).toBe('test-generator');
      expect(result?.packageName).toBe('@test/package1');
      expect(result?.packagePath).toBe('/packages/package1');
      expect(result?.generatorDirectory).toBe(
        '/packages/package1/generators/test',
      );
    });

    it('should return undefined for non-existent generator', () => {
      const result = lookup.getExtractorConfig('non-existent#generator');
      expect(result).toBeUndefined();
    });
  });

  describe('getExtractorConfigOrThrow', () => {
    it('should return config for existing generator', () => {
      const result = lookup.getExtractorConfigOrThrow(
        '@test/package1#test-generator',
      );
      expect(result.config.name).toBe('test-generator');
    });

    it('should throw for non-existent generator', () => {
      expect(() =>
        lookup.getExtractorConfigOrThrow('non-existent#generator'),
      ).toThrow('Generator non-existent#generator not found');
    });
  });

  describe('getProviderConfigsByType', () => {
    it('should return all providers of specified type', () => {
      const schema = z.object({
        type: z.literal('ts-imports'),
        includeTypes: z.boolean(),
      });

      const results = lookup.getProviderConfigsByType('ts-imports', schema);

      expect(results).toHaveLength(2);
      expect(results[0].config.type).toBe('ts-imports');
      expect(results[0].config.includeTypes).toBe(true);
      expect(results[1].config.type).toBe('ts-imports');
      expect(results[1].config.includeTypes).toBe(false);
    });

    it('should return empty array for non-existent type', () => {
      const schema = z.object({ type: z.literal('non-existent') });
      const results = lookup.getProviderConfigsByType('non-existent', schema);
      expect(results).toHaveLength(0);
    });
  });

  describe('getTemplatesForGenerator', () => {
    it('should return templates of specified type', () => {
      const schema = z.object({
        sourceFile: z.string(),
        type: z.literal('ts'),
      });

      const results = lookup.getTemplatesForGenerator(
        '@test/package1#test-generator',
        schema,
        'ts',
      );

      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('template1');
      expect(results[0].config.sourceFile).toBe('template1.ts');
      expect(results[1].name).toBe('template2');
      expect(results[1].config.sourceFile).toBe('template2.ts');
    });
  });

  describe('getPluginConfigForGenerator', () => {
    it('should return plugin config when it exists', () => {
      const schema = z.object({ enabled: z.boolean() });

      const result = lookup.getPluginConfigForGenerator(
        '@test/package1#test-generator',
        'test-plugin',
        schema,
      );

      expect(result).toEqual({ enabled: true });
    });

    it('should return undefined for non-existent plugin', () => {
      const schema = z.object({ enabled: z.boolean() });

      const result = lookup.getPluginConfigForGenerator(
        '@test/package1#test-generator',
        'non-existent-plugin',
        schema,
      );

      expect(result).toBeUndefined();
    });

    it('should return undefined for generator without plugins', () => {
      const schema = z.object({ enabled: z.boolean() });

      const result = lookup.getPluginConfigForGenerator(
        '@test/package2#other-generator',
        'any-plugin',
        schema,
      );

      expect(result).toBeUndefined();
    });
  });

  describe('getExtractorConfigForGenerator', () => {
    it('should return extractor config when it exists', () => {
      const schema = z.object({ includeComments: z.boolean() });

      const result = lookup.getExtractorConfigForGenerator(
        '@test/package1#test-generator',
        'ts',
        schema,
      );

      expect(result).toEqual({ includeComments: true });
    });

    it('should return undefined for non-existent extractor type', () => {
      const schema = z.object({ includeComments: z.boolean() });

      const result = lookup.getExtractorConfigForGenerator(
        '@test/package1#test-generator',
        'non-existent',
        schema,
      );

      expect(result).toBeUndefined();
    });
  });

  describe('initialization', () => {
    it('should throw when methods are called before initialization', () => {
      const uninitializedLookup = new TemplateExtractorConfigLookup(
        mockPackageMap,
      );

      expect(() =>
        uninitializedLookup.getExtractorConfig('any#generator'),
      ).toThrow('TemplateExtractorConfigLookup must be initialized before use');
    });
  });
});
