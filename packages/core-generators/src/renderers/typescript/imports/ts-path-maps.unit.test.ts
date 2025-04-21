import { describe, expect, it } from 'vitest';

import {
  generatePathMapEntries,
  pathMapEntriesToRegexes,
} from './ts-path-maps.js';

describe('generatePathMapEntries', () => {
  it('should return a valid TsPathMapEntry list', () => {
    // Arrange
    const baseUrl = './src';
    const paths = {
      '@src/*': ['./*'],
      '@components/*': ['./components/*'],
      'no-star': ['./something'],
    };

    // Act
    const result = generatePathMapEntries(baseUrl, paths);

    // Assert
    expect(result).toEqual([
      { from: '@src/*', to: './src/*' },
      { from: '@components/*', to: './src/components/*' },
      { from: 'no-star', to: './src/something' },
    ]);
  });

  it('should return a valid TsPathMapEntry list when baseUrl is undefined', () => {
    // Arrange
    const baseUrl = undefined;
    const paths = {
      '@src/*': ['./src/*'],
    };

    // Act
    const result = generatePathMapEntries(baseUrl, paths);

    // Assert
    expect(result).toEqual([{ from: '@src/*', to: './src/*' }]);
  });
});

describe('pathMapEntriesToRegexes', () => {
  it('should generate correct regexes for internal module aliases', () => {
    // Arrange
    const entries = [
      { from: '@src/*', to: './src/*' },
      { from: '@utils/*', to: './src/utils/*' },
      { from: 'no-star', to: './src/something' },
    ];

    // Act
    const regexes = pathMapEntriesToRegexes(entries);

    // Assert
    expect(regexes[0].test('@src/foo')).toBe(true);
    expect(regexes[0].test('@src/foo/bar')).toBe(true);
    expect(regexes[0].test('@src')).toBe(false);

    expect(regexes[1].test('@utils/abc')).toBe(true);
    expect(regexes[1].test('@utils')).toBe(false);

    expect(regexes[2].test('no-star')).toBe(true);
    expect(regexes[2].test('no-star/else')).toBe(false);
  });
});
