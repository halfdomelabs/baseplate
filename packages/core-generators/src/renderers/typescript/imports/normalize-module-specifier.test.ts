import { describe, expect, it } from 'vitest';

import type { TsPathMapEntry } from './types.js';

import {
  getProjectRelativePathFromModuleSpecifier,
  normalizeModuleSpecifier,
} from './normalize-module-specifier.js';

describe('normalizeModuleSpecifier', () => {
  const directory = 'src';

  it('should return external module specifier as is', () => {
    const result = normalizeModuleSpecifier('axios', directory, {
      moduleResolution: 'classic',
    });
    expect(result).toBe('axios');
  });

  it('should normalize a relative import for non-Node16 by stripping .js extension', () => {
    const result = normalizeModuleSpecifier('./foo.js', directory, {
      moduleResolution: 'classic',
    });
    expect(result).toBe('./foo');
  });

  it('should normalize an alias import using path map entries for non-Node16', () => {
    const pathMapEntries: TsPathMapEntry[] = [
      { from: '@alias/*', to: 'src/alias/*' },
    ];
    const result = normalizeModuleSpecifier('./alias/foo.js', directory, {
      moduleResolution: 'classic',
      pathMapEntries,
    });
    // Expected to pick the shorter alias path (after stripping .js): '@alias/foo'
    expect(result).toBe('@alias/foo');
  });

  it('should use relative path if it is shorter', () => {
    const pathMapEntries: TsPathMapEntry[] = [
      { from: '@alias/*', to: 'src/alias/*' },
    ];
    const result = normalizeModuleSpecifier('./foo.js', `${directory}/alias`, {
      moduleResolution: 'classic',
      pathMapEntries,
    });
    expect(result).toBe('./foo');
  });

  it('should throw error for Node16 relative import missing .js extension', () => {
    expect(() =>
      normalizeModuleSpecifier('./foo', directory, {
        moduleResolution: 'node16',
      }),
    ).toThrow(/Invalid Node 16 import discovered/);
  });

  it('should not throw for Node16 relative import with .js extension', () => {
    const result = normalizeModuleSpecifier('./foo.js', directory, {
      moduleResolution: 'node16',
    });
    expect(result).toBe('./foo.js');
  });

  it('should return external module specifier as is for Node16', () => {
    const result = normalizeModuleSpecifier('axios', directory, {
      moduleResolution: 'node16',
    });
    expect(result).toBe('axios');
  });
});

describe('getProjectRelativePathFromModuleSpecifier', () => {
  const directory = 'src';

  it('should return undefined for external module specifier', () => {
    const result = getProjectRelativePathFromModuleSpecifier(
      'axios',
      directory,
    );
    expect(result).toBeUndefined();
  });

  it('should return project relative path for internal module specifier', () => {
    const result = getProjectRelativePathFromModuleSpecifier(
      '@/components/Button',
      directory,
    );
    expect(result).toBe('components/Button');
  });
});
