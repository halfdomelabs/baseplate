import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { GeneratorConfig } from './generators.js';

import * as loadDefaultExportUtils from '../utils/load-default-export.js';
import { loadGeneratorsForPackage } from './loader.js';

vi.mock('fs');
vi.mock('fs/promises');
vi.mock('node:fs');
vi.mock('../utils/load-default-export.js');

const mockedLoadDefaultExportUtils = vi.mocked(loadDefaultExportUtils);

beforeEach(() => {
  vol.reset();
});

describe('loadGeneratorsForPackage', () => {
  it('loads a set of generators from a folder', async () => {
    vol.fromJSON(
      {
        '/modules/test-generators/dist/generators/generatorOne/index.ts':
          'a();',
        '/modules/test-generators/dist/generators/generatorTwo/index.ts':
          'a();',
        '/modules/test-generators/dist/generators/_ignored/index.ts': 'a();',
        '/modules/test-generators/dist/generators/index.ts': 'a();',
        '/modules/test-generators/dist/random/foo.yml': 'test',
        '/modules/test-generators/generator.json': JSON.stringify({
          generatorBaseDirectory: 'dist/generators',
          generatorPatterns: ['*'],
        }),
      },
      '/modules/test-generators',
    );
    const mockGeneratorOne: GeneratorConfig = {
      createGenerator: vi.fn(),
    };
    const mockGeneratorTwo: GeneratorConfig = {
      createGenerator: vi.fn(),
    };
    mockedLoadDefaultExportUtils.loadDefaultExport.mockResolvedValueOnce(
      mockGeneratorOne,
    );
    mockedLoadDefaultExportUtils.loadDefaultExport.mockResolvedValueOnce(
      mockGeneratorTwo,
    );

    const generator = await loadGeneratorsForPackage(
      '@halfdomelabs/test-generators',
      '/modules/test-generators',
    );

    expect(generator).toEqual({
      '@halfdomelabs/test/generatorOne': {
        config: mockGeneratorOne,
        directory: '/modules/test-generators/dist/generators/generatorOne',
      },
      '@halfdomelabs/test/generatorTwo': {
        config: mockGeneratorTwo,
        directory: '/modules/test-generators/dist/generators/generatorTwo',
      },
    });

    expect(mockedLoadDefaultExportUtils.loadDefaultExport).toHaveBeenCalledWith(
      '/modules/test-generators/dist/generators/generatorOne',
    );
    expect(mockedLoadDefaultExportUtils.loadDefaultExport).toHaveBeenCalledWith(
      '/modules/test-generators/dist/generators/generatorTwo',
    );
  });

  it('loads a set of generators with right glob patterns and different base', async () => {
    vol.fromJSON(
      {
        '/modules/test-generators/dist/generators/one/generatorOne/index.ts':
          'a();',
        '/modules/test-generators/dist/generators/two/generatorTwo/index.ts':
          'a();',
        '/modules/test-generators/dist/generators/index.ts': 'a();',
        '/modules/test-generators/dist/generators/one/index.yml': 'test',
        '/modules/test-generators/generator.json': JSON.stringify({
          generatorBaseDirectory: 'dist/generators',
          generatorPatterns: ['*/*'],
        }),
        '/modules/test-generators/dist/random/foo.yml': 'test',
      },
      '/modules/test-generators',
    );
    const mockGeneratorOne: GeneratorConfig = {
      createGenerator: vi.fn(),
    };
    const mockGeneratorTwo: GeneratorConfig = {
      createGenerator: vi.fn(),
    };
    mockedLoadDefaultExportUtils.loadDefaultExport.mockResolvedValueOnce(
      mockGeneratorOne,
    );
    mockedLoadDefaultExportUtils.loadDefaultExport.mockResolvedValueOnce(
      mockGeneratorTwo,
    );

    const generator = await loadGeneratorsForPackage(
      '@halfdomelabs/test-generators',
      '/modules/test-generators',
    );

    expect(generator).toEqual({
      '@halfdomelabs/test/one/generatorOne': {
        config: mockGeneratorOne,
        directory: '/modules/test-generators/dist/generators/one/generatorOne',
      },
      '@halfdomelabs/test/two/generatorTwo': {
        config: mockGeneratorTwo,
        directory: '/modules/test-generators/dist/generators/two/generatorTwo',
      },
    });

    expect(mockedLoadDefaultExportUtils.loadDefaultExport).toHaveBeenCalledWith(
      '/modules/test-generators/dist/generators/one/generatorOne',
    );
    expect(mockedLoadDefaultExportUtils.loadDefaultExport).toHaveBeenCalledWith(
      '/modules/test-generators/dist/generators/two/generatorTwo',
    );
  });
});
