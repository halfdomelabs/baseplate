import { vol } from 'memfs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { indexTemplateConfigs } from './index-template-configs.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');

describe('indexTemplateConfigs', () => {
  beforeEach(() => {
    vol.reset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should index both extractor and provider configs from multiple packages', async () => {
    // Setup mock file system with both types of configs
    vol.fromJSON({
      '/packages/pkg1/generator1/extractor.json': JSON.stringify({
        name: 'test-generator-1',
        templates: {
          'template1.ts': { name: 'template1', type: 'ts' },
          'template2.ts': { name: 'template2', type: 'ts' },
        },
      }),
      '/packages/pkg1/generator2/extractor.json': JSON.stringify({
        name: 'test-generator-2',
        templates: {
          'template3.ts': { name: 'template3', type: 'ts' },
        },
      }),
      '/packages/pkg1/providers/providers.json': JSON.stringify({
        'feature.ts': {
          featuresProvider: {
            type: 'path',
            pathRoots: [{ name: 'feature-root', method: 'featureRoot' }],
          },
        },
      }),
      '/packages/pkg2/generator3/extractor.json': JSON.stringify({
        name: 'test-generator-3',
        templates: {
          'template4.ts': { name: 'template4', type: 'ts' },
          'template5.ts': { name: 'template5', type: 'ts' },
          'template6.ts': { name: 'template6', type: 'ts' },
        },
      }),
      '/packages/pkg2/providers/providers.json': JSON.stringify({
        'utils.ts': {
          utilsProvider: { type: 'utility' },
          configProvider: { type: 'config', source: 'env' },
        },
      }),
    });

    const packageMap = new Map([
      ['pkg1', '/packages/pkg1'],
      ['pkg2', '/packages/pkg2'],
    ]);

    const result = await indexTemplateConfigs(packageMap);

    // Check extractor entries
    expect(result.extractorEntries).toHaveLength(3);

    const extractorEntries = result.extractorEntries.toSorted((a, b) =>
      a.generatorName.localeCompare(b.generatorName),
    );

    expect(extractorEntries[0]).toEqual({
      config: {
        name: 'test-generator-1',
        templates: {
          'template1.ts': { name: 'template1', type: 'ts' },
          'template2.ts': { name: 'template2', type: 'ts' },
        },
      },
      generatorDirectory: '/packages/pkg1/generator1',
      packageName: 'pkg1',
      packagePath: '/packages/pkg1',
      generatorName: 'pkg1#test-generator-1',
    });

    expect(extractorEntries[1]).toEqual({
      config: {
        name: 'test-generator-2',
        templates: {
          'template3.ts': { name: 'template3', type: 'ts' },
        },
      },
      generatorDirectory: '/packages/pkg1/generator2',
      packageName: 'pkg1',
      packagePath: '/packages/pkg1',
      generatorName: 'pkg1#test-generator-2',
    });

    expect(extractorEntries[2]).toEqual({
      config: {
        name: 'test-generator-3',
        templates: {
          'template4.ts': { name: 'template4', type: 'ts' },
          'template5.ts': { name: 'template5', type: 'ts' },
          'template6.ts': { name: 'template6', type: 'ts' },
        },
      },
      generatorDirectory: '/packages/pkg2/generator3',
      packageName: 'pkg2',
      packagePath: '/packages/pkg2',
      generatorName: 'pkg2#test-generator-3',
    });

    // Check provider entries
    expect(result.providerEntries).toHaveLength(3);

    const providerEntries = result.providerEntries.toSorted((a, b) =>
      a.packagePathSpecifier.localeCompare(b.packagePathSpecifier),
    );

    expect(providerEntries[0]).toEqual({
      config: {
        type: 'path',
        pathRoots: [{ name: 'feature-root', method: 'featureRoot' }],
      },
      packagePathSpecifier: 'pkg1:providers/feature.ts',
      providerName: 'featuresProvider',
      packageName: 'pkg1',
      packagePath: '/packages/pkg1',
    });

    expect(providerEntries[1]).toEqual({
      config: { type: 'utility' },
      packagePathSpecifier: 'pkg2:providers/utils.ts',
      providerName: 'utilsProvider',
      packageName: 'pkg2',
      packagePath: '/packages/pkg2',
    });

    expect(providerEntries[2]).toEqual({
      config: { type: 'config', source: 'env' },
      packagePathSpecifier: 'pkg2:providers/utils.ts',
      providerName: 'configProvider',
      packageName: 'pkg2',
      packagePath: '/packages/pkg2',
    });
  });

  it('should handle packages with only extractor configs', async () => {
    vol.fromJSON({
      '/packages/pkg1/generator1/extractor.json': JSON.stringify({
        name: 'test-generator-1',
        templates: {
          'template1.ts': { name: 'template1', type: 'ts' },
        },
      }),
    });

    const packageMap = new Map([['pkg1', '/packages/pkg1']]);

    const result = await indexTemplateConfigs(packageMap);

    expect(result.extractorEntries).toHaveLength(1);
    expect(result.providerEntries).toHaveLength(0);
  });

  it('should handle packages with only provider configs', async () => {
    vol.fromJSON({
      '/packages/pkg1/providers/providers.json': JSON.stringify({
        'feature.ts': {
          featuresProvider: { type: 'path' },
        },
      }),
    });

    const packageMap = new Map([['pkg1', '/packages/pkg1']]);

    const result = await indexTemplateConfigs(packageMap);

    expect(result.extractorEntries).toHaveLength(0);
    expect(result.providerEntries).toHaveLength(1);
  });

  it('should handle empty packages', async () => {
    vol.fromJSON({
      '/packages/empty-pkg/some-file.txt': 'not a generator',
    });

    const packageMap = new Map([['empty-pkg', '/packages/empty-pkg']]);

    const result = await indexTemplateConfigs(packageMap);

    expect(result.extractorEntries).toHaveLength(0);
    expect(result.providerEntries).toHaveLength(0);
  });

  it('should throw error for invalid extractor.json', async () => {
    vol.fromJSON({
      '/packages/invalid-pkg/generator/extractor.json': JSON.stringify({
        // Missing required 'name' field
        templates: {},
      }),
    });

    const packageMap = new Map([['invalid-pkg', '/packages/invalid-pkg']]);

    await expect(indexTemplateConfigs(packageMap)).rejects.toThrow();
  });

  it('should throw error for invalid providers.json', async () => {
    vol.fromJSON({
      '/packages/invalid-pkg/providers.json': JSON.stringify({
        'feature.ts': {
          featuresProvider: {
            // Missing required 'type' field
            pathRoots: [],
          },
        },
      }),
    });

    const packageMap = new Map([['invalid-pkg', '/packages/invalid-pkg']]);

    await expect(indexTemplateConfigs(packageMap)).rejects.toThrow();
  });

  it('should handle nested generator directories', async () => {
    vol.fromJSON({
      '/packages/nested/generators/auth/auth-module/extractor.json':
        JSON.stringify({
          name: 'auth/auth-module',
          templates: {
            'auth.service.ts': { name: 'auth-service', type: 'ts' },
          },
        }),
      '/packages/nested/providers/deep/nested/providers.json': JSON.stringify({
        'config.ts': {
          configProvider: { type: 'config' },
        },
      }),
    });

    const packageMap = new Map([['nested-pkg', '/packages/nested']]);

    const result = await indexTemplateConfigs(packageMap);

    expect(result.extractorEntries).toHaveLength(1);
    expect(result.extractorEntries[0].generatorName).toBe(
      'nested-pkg#auth/auth-module',
    );
    expect(result.extractorEntries[0].generatorDirectory).toBe(
      '/packages/nested/generators/auth/auth-module',
    );

    expect(result.providerEntries).toHaveLength(1);
    expect(result.providerEntries[0].packagePathSpecifier).toBe(
      'nested-pkg:providers/deep/nested/config.ts',
    );
  });

  it('should handle multiple providers in single file', async () => {
    vol.fromJSON({
      '/packages/pkg/providers.json': JSON.stringify({
        'multi.ts': {
          provider1: { type: 'type1' },
          provider2: { type: 'type2' },
          provider3: { type: 'type3' },
        },
      }),
    });

    const packageMap = new Map([['pkg', '/packages/pkg']]);

    const result = await indexTemplateConfigs(packageMap);

    expect(result.providerEntries).toHaveLength(3);
    expect(result.providerEntries.map((e) => e.providerName)).toEqual([
      'provider1',
      'provider2',
      'provider3',
    ]);
    expect(
      result.providerEntries.every(
        (e) => e.packagePathSpecifier === 'pkg:multi.ts',
      ),
    ).toBe(true);
  });

  it('should accumulate errors and throw if any package fails', async () => {
    vol.fromJSON({
      '/packages/good/extractor.json': JSON.stringify({
        name: 'good-generator',
        templates: {},
      }),
      '/packages/bad/extractor.json': JSON.stringify({
        // Invalid config
      }),
    });

    const packageMap = new Map([
      ['good-pkg', '/packages/good'],
      ['bad-pkg', '/packages/bad'],
    ]);

    await expect(indexTemplateConfigs(packageMap)).rejects.toThrow(
      'Failed to index some packages',
    );
  });
});
