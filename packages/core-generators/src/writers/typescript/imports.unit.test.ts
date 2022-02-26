import { resolveModule } from './imports';

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
});
