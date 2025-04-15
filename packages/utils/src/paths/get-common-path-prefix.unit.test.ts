import { describe, expect, it } from 'vitest';

import { getCommonPathPrefix } from './get-common-path-prefix.js';

describe('getCommonPathPrefix', () => {
  it('should return empty string for empty array', () => {
    expect(getCommonPathPrefix([])).toBe('');
  });

  it('should return directory of single path', () => {
    expect(getCommonPathPrefix(['/home/user/project/file.txt'])).toBe(
      '/home/user/project',
    );
  });

  it('should return directory of same paths', () => {
    expect(
      getCommonPathPrefix([
        '/home/user/project/file.txt',
        '/home/user/project/file.txt',
      ]),
    ).toBe('/home/user/project');
  });

  it('should find common prefix for multiple paths', () => {
    const paths = [
      '/home/user/project/src/file1.ts',
      '/home/user/project/src/file2.ts',
      '/home/user/project/src/utils/file3.ts',
    ];
    expect(getCommonPathPrefix(paths)).toBe('/home/user/project/src');
  });

  it('should handle paths with no common prefix', () => {
    const paths = ['/home/user1/file.txt', '/home/user2/file.txt'];
    expect(getCommonPathPrefix(paths)).toBe('/home');
  });

  it('should handle paths with different depths', () => {
    const paths = [
      '/home/user/project/file.txt',
      '/home/user/project/src/utils/file.txt',
      '/home/user/project/README.md',
    ];
    expect(getCommonPathPrefix(paths)).toBe('/home/user/project');
  });

  it('should handle root directory as common prefix', () => {
    const paths = [
      '/home/user1/file.txt',
      '/home/user2/file.txt',
      '/etc/config.txt',
    ];
    expect(getCommonPathPrefix(paths)).toBe('/');
  });
});
