import { describe, it, expect } from 'vitest';

import { ellipsisStringFromMiddle } from './string';

describe('ellipsisStringFromMiddle', () => {
  it('returns the original string if it fits within maxLength', () => {
    expect(ellipsisStringFromMiddle('StartEnd', 20)).toBe('StartEnd');
  });

  it('trims middle words when necessary', () => {
    expect(ellipsisStringFromMiddle('StartMiddleEnd', 12)).toBe('Start...End');
  });

  it('trims minimal middle words starting from the penultimate word back', () => {
    expect(ellipsisStringFromMiddle('OneTwoThreeFourFive', 15)).toBe(
      'OneTwo...Five',
    );
  });

  it('falls back to truncating the start word and adding ... if start and end words are too long', () => {
    expect(
      ellipsisStringFromMiddle('Supercalifragilisticexpialidocious', 10),
    ).toBe('Superca...');
  });

  it('returns "..." if maxLength is too small', () => {
    expect(ellipsisStringFromMiddle('HelloWorld', 2)).toBe('...');
  });

  it('handles snake_case strings', () => {
    expect(ellipsisStringFromMiddle('one_two_three_four', 14)).toBe(
      'one_two...four',
    );
  });

  it('handles camelCase strings', () => {
    expect(ellipsisStringFromMiddle('oneTwoThreeFour', 14)).toBe(
      'oneTwo...Four',
    );
  });

  it('handles PascalCase strings', () => {
    expect(ellipsisStringFromMiddle('OneTwoThreeFour', 14)).toBe(
      'OneTwo...Four',
    );
  });

  it('handles strings with multiple capital letters in sequence', () => {
    expect(ellipsisStringFromMiddle('HTTPRequestHandler', 15)).toBe(
      'HTTP...Handler',
    );
  });
});
