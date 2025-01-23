import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { findNearestPackageJson } from './find-nearest-package-json.js';

vi.mock('node:fs/promises');

describe('findNearestPackageJson', () => {
  beforeEach(() => {
    vol.reset();
  });

  it('finds the nearest package.json', async () => {
    vol.fromJSON(
      {
        '/project/package.json': '{}',
        '/project/src/index.ts': '',
      },
      '/',
    );

    const result = await findNearestPackageJson({
      cwd: '/project/src',
    });

    expect(result).toBe('/project/package.json');
  });

  it('returns undefined if no package.json is found', async () => {
    vol.fromJSON(
      {
        '/project/src/index.ts': '',
      },
      '/',
    );

    const result = await findNearestPackageJson({
      cwd: '/project/src',
    });

    expect(result).toBeUndefined();
  });

  it('stops at node_modules if stopAtNodeModules is true', async () => {
    vol.fromJSON(
      {
        '/project/node_modules/.bin/some-module': '',
        '/project/package.json': '{}',
      },
      '/',
    );

    const result = await findNearestPackageJson({
      cwd: '/project/node_modules/.bin/some-module',
      stopAtNodeModules: true,
    });

    expect(result).toBeUndefined();
  });

  it('ignores node_modules if stopAtNodeModules is false', async () => {
    vol.fromJSON(
      {
        '/project/node_modules/.bin/some-module': '',
        '/project/src/package.json': '{}',
        '/project/src/index.ts': '',
      },
      '/',
    );

    const result = await findNearestPackageJson({
      cwd: '/project/src',
      stopAtNodeModules: false,
    });

    expect(result).toBe('/project/src/package.json');
  });

  it('handles the root directory gracefully', async () => {
    vol.fromJSON(
      {
        '/package.json': '{}',
      },
      '/',
    );

    const result = await findNearestPackageJson({
      cwd: '/',
    });

    expect(result).toBe('/package.json');
  });
});
