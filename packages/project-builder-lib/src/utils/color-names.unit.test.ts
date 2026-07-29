import { describe, expect, it } from 'vitest';

import { convertColorNameToOklch } from './color-names.js';

describe('convertColorNameToOklch', () => {
  it('resolves a fixed color name', () => {
    expect(convertColorNameToOklch('white')).toBe('oklch(1 0 0)');
  });

  it('resolves a palette-shade color name', () => {
    expect(convertColorNameToOklch('red-500')).toBe(
      'oklch(0.637 0.237 25.331)',
    );
  });

  it('returns the input unchanged for an unrecognized palette name', () => {
    expect(convertColorNameToOklch('not-a-palette-500')).toBe(
      'not-a-palette-500',
    );
  });

  it('returns the input unchanged for a color name with extra hyphenated segments', () => {
    expect(convertColorNameToOklch('red-500-extra')).toBe('red-500-extra');
  });

  it('returns the input unchanged for a raw hex color', () => {
    expect(convertColorNameToOklch('#ff0000')).toBe('#ff0000');
  });
});
