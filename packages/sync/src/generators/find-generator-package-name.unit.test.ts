import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PackageNameCache } from './find-generator-package-name.js';

import { findGeneratorPackageName } from './find-generator-package-name.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');

describe('findGeneratorPackageName', () => {
  beforeEach(() => {
    vol.reset();
  });

  it('finds package name from nearest package.json', async () => {
    const testFs = {
      '/test/package.json': JSON.stringify({
        name: 'test-package',
      }),
      '/test/generators/my-generator/index.ts': '',
    };
    vol.fromJSON(testFs, '/');

    const cache: PackageNameCache = new Map();
    const packageName = await findGeneratorPackageName(
      '/test/generators/my-generator',
      cache,
    );

    expect(packageName).toBe('test-package');
    expect(cache.get('/test/generators/my-generator')).toBe('test-package');
  });

  it('uses cached package name if available', async () => {
    const cache: PackageNameCache = new Map();
    cache.set('/test/generators/my-generator', 'cached-package');

    const packageName = await findGeneratorPackageName(
      '/test/generators/my-generator',
      cache,
    );

    expect(packageName).toBe('cached-package');
  });

  it('throws error if no package.json found', async () => {
    const cache: PackageNameCache = new Map();
    await expect(
      findGeneratorPackageName('/test/generators/my-generator', cache),
    ).rejects.toThrow('No package.json found');
  });

  it('throws error if package.json has no name', async () => {
    const testFs = {
      '/test/package.json': JSON.stringify({}),
      '/test/generators/my-generator/index.ts': '',
    };
    vol.fromJSON(testFs, '/');

    const cache: PackageNameCache = new Map();
    await expect(
      findGeneratorPackageName('/test/generators/my-generator', cache),
    ).rejects.toThrow('No package name found');
  });

  it('throws error if package.json is invalid', async () => {
    const testFs = {
      '/test/package.json': 'invalid json',
      '/test/generators/my-generator/index.ts': '',
    };
    vol.fromJSON(testFs, '/');

    const cache: PackageNameCache = new Map();
    await expect(
      findGeneratorPackageName('/test/generators/my-generator', cache),
    ).rejects.toThrow('Failed to read or parse package.json');
  });
});
