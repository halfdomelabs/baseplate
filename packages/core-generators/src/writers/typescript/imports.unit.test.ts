import { describe, it, expect } from 'vitest';
import { resolveModule } from './imports.js';

describe('resolveModule', () => {
  it('does not alter normal module import', () => {
    const resolvedModule = resolveModule('@types/node', './test');
    expect(resolvedModule).toBe('@types/node');
  });

  it('finds relative path for specifiers beginning with @/', () => {
    const resolvedModule = resolveModule('@/src/hi/test', './src/hello');
    expect(resolvedModule).toBe('../hi/test');
  });

  it('finds subdirectory path for specifiers beginning with @/', () => {
    const resolvedModule = resolveModule('@/src/hi/test', './src/hi');
    expect(resolvedModule).toBe('./test');
  });

  it('uses typescript paths when it exists and is shorter', () => {
    const resolvedModule = resolveModule(
      '@/src/hi/test',
      './src/hello/foo/dom',
      { pathMapEntries: [{ from: 'src/hi', to: '@hi' }] }
    );
    expect(resolvedModule).toBe('@hi/test');
  });

  it('uses relative paths when typescript paths exist but is longer', () => {
    const resolvedModule = resolveModule('@/src/hi/test', './src/hi/dom', {
      pathMapEntries: [{ from: 'src/hi', to: '@hi' }],
    });
    expect(resolvedModule).toBe('../test');
  });

  it('uses relative paths when paths does not exist', () => {
    const resolvedModule = resolveModule(
      '@/src/hello/test',
      './src/there/dom',
      {
        pathMapEntries: [{ from: 'src/hi', to: '@hi' }],
      }
    );
    expect(resolvedModule).toBe('../../hello/test');
  });
});
