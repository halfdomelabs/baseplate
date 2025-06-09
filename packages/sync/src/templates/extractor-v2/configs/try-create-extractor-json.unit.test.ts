import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { tryCreateExtractorJson } from './try-create-extractor-json.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');

describe('tryCreateExtractorJson', () => {
  beforeEach(() => {
    vol.reset();
  });

  it('should create extractor.json when single generator file exists', async () => {
    // Arrange
    const packagePath = '/test-package';
    const generatorName = 'test-package#auth/login';
    const packageMap = new Map<string, string>([
      ['test-package', '/test-package'],
    ]);

    vol.fromJSON({
      [`${packagePath}/src/generators/auth/login/login.generator.ts`]:
        'export const generator = {};',
    });

    // Act
    await tryCreateExtractorJson({
      packageMap,
      generatorName,
    });

    // Assert
    const files = vol.toJSON();
    expect(
      files[`${packagePath}/src/generators/auth/login/extractor.json`],
    ).toBeDefined();

    const extractorConfig = JSON.parse(
      files[`${packagePath}/src/generators/auth/login/extractor.json`] ?? '{}',
    ) as { name: string };
    expect(extractorConfig).toEqual({
      name: 'auth/login',
    });
  });

  it('should throw error when no generator file is found', async () => {
    // Arrange
    const packagePath = '/test-package';
    const generatorName = 'test-package#auth/login';
    const packageMap = new Map<string, string>([
      ['test-package', '/test-package'],
    ]);

    vol.fromJSON({
      [`${packagePath}/src/other-file.ts`]: 'export const other = {};',
    });

    // Act & Assert
    await expect(
      tryCreateExtractorJson({
        packageMap,
        generatorName,
      }),
    ).rejects.toThrow(
      'No generator file found matching pattern: auth/login.generator.ts',
    );
  });

  it('should throw error when multiple generator files are found', async () => {
    // Arrange
    const packagePath = '/test-package';
    const generatorName = 'test-package#auth/login';
    const packageMap = new Map<string, string>([
      ['test-package', '/test-package'],
    ]);

    vol.fromJSON({
      [`${packagePath}/src/generators/auth/login/login.generator.ts`]:
        'export const generator1 = {};',
      [`${packagePath}/lib/generators/auth/login/login.generator.ts`]:
        'export const generator2 = {};',
    });

    // Act & Assert
    await expect(
      tryCreateExtractorJson({
        packageMap,
        generatorName,
      }),
    ).rejects.toThrow(
      'Multiple generator files found matching pattern: auth/login.generator.ts',
    );
  });

  it('should create properly formatted JSON with newline', async () => {
    // Arrange
    const packagePath = '/test-package';
    const generatorName = 'test-package#simple';
    const packageMap = new Map<string, string>([
      ['test-package', '/test-package'],
    ]);

    vol.fromJSON({
      [`${packagePath}/generators/simple/simple.generator.ts`]:
        'export const generator = {};',
    });

    // Act
    await tryCreateExtractorJson({
      packageMap,
      generatorName,
    });

    // Assert
    const files = vol.toJSON();
    const extractorJsonContent =
      files[`${packagePath}/generators/simple/extractor.json`] ?? '{}';

    expect(extractorJsonContent).toBe('{\n  "name": "simple"\n}\n');
  });
});
