import { describe, it, expect } from 'vitest';

import { resolveModule, ResolveModuleOptions } from './imports.js';

describe('resolveModule', () => {
  describe('with node resolution method', () => {
    const options: ResolveModuleOptions = {
      moduleResolution: 'node',
    };

    it('does not alter normal module import', () => {
      const resolvedModule = resolveModule('@types/node', './test', options);
      expect(resolvedModule).toBe('@types/node');
    });

    it('removes extra .js suffix', () => {
      const resolvedModule = resolveModule(
        '@/src/hi/test.js',
        './src/hello',
        options,
      );
      expect(resolvedModule).toBe('../hi/test');
    });

    it('removes extra /index.js suffix', () => {
      const resolvedModule = resolveModule(
        '@/src/hi/test/index.js',
        './src/hello',
        options,
      );
      expect(resolvedModule).toBe('../hi/test');
    });

    it('finds relative path for specifiers beginning with @/', () => {
      const resolvedModule = resolveModule(
        '@/src/hi/test',
        './src/hello',
        options,
      );
      expect(resolvedModule).toBe('../hi/test');
    });

    it('finds subdirectory path for specifiers beginning with @/', () => {
      const resolvedModule = resolveModule(
        '@/src/hi/test',
        './src/hi',
        options,
      );
      expect(resolvedModule).toBe('./test');
    });

    it('uses typescript paths when it exists and is shorter', () => {
      const resolvedModule = resolveModule(
        '@/src/hi/test',
        './src/hello/foo/dom',
        { pathMapEntries: [{ from: 'src/hi', to: '@hi' }], ...options },
      );
      expect(resolvedModule).toBe('@hi/test');
    });

    it('uses relative paths when typescript paths exist but is longer', () => {
      const resolvedModule = resolveModule('@/src/hi/test', './src/hi/dom', {
        pathMapEntries: [{ from: 'src/hi', to: '@hi' }],
        ...options,
      });
      expect(resolvedModule).toBe('../test');
    });

    it('uses relative paths when paths does not exist', () => {
      const resolvedModule = resolveModule(
        '@/src/hello/test',
        './src/there/dom',
        {
          pathMapEntries: [{ from: 'src/hi', to: '@hi' }],
          ...options,
        },
      );
      expect(resolvedModule).toBe('../../hello/test');
    });
  });

  describe('with Node16 resolution method', () => {
    const options: ResolveModuleOptions = {
      moduleResolution: 'node16',
    };

    it('does not alter normal module import', () => {
      const resolvedModule = resolveModule('@types/node', './test', options);
      expect(resolvedModule).toBe('@types/node');
    });

    it('finds relative path for specifiers beginning with @/', () => {
      const resolvedModule = resolveModule(
        '@/src/hi/test.js',
        './src/hello',
        options,
      );
      expect(resolvedModule).toBe('../hi/test.js');
    });

    it('finds subdirectory path for specifiers beginning with @/', () => {
      const resolvedModule = resolveModule(
        '@/src/hi/test.js',
        './src/hi',
        options,
      );
      expect(resolvedModule).toBe('./test.js');
    });

    it('uses typescript paths when it exists and is shorter', () => {
      const resolvedModule = resolveModule(
        '@/src/hi/test.js',
        './src/hello/foo/dom',
        { pathMapEntries: [{ from: 'src/hi', to: '@hi' }], ...options },
      );
      expect(resolvedModule).toBe('@hi/test.js');
    });

    it('uses relative paths when typescript paths exist but is longer', () => {
      const resolvedModule = resolveModule('@/src/hi/test.js', './src/hi/dom', {
        pathMapEntries: [{ from: 'src/hi', to: '@hi' }],
        ...options,
      });
      expect(resolvedModule).toBe('../test.js');
    });

    it('uses relative paths when paths does not exist', () => {
      const resolvedModule = resolveModule(
        '@/src/hello/test.js',
        './src/there/dom',
        {
          pathMapEntries: [{ from: 'src/hi', to: '@hi' }],
          ...options,
        },
      );
      expect(resolvedModule).toBe('../../hello/test.js');
    });
  });
});
