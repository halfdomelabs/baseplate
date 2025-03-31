import { describe, expect, it } from 'vitest';

import { mapValuesOfMap } from './map-values-of-map.js';

describe('mapValuesOfMap', () => {
  it('transforms values of a map while preserving keys', () => {
    // Arrange
    const input = new Map([
      ['a', 1],
      ['b', 2],
      ['c', 3],
    ]);

    // Act
    const result = mapValuesOfMap(input, (v) => v * 10);

    // Assert
    expect(result).toEqual(
      new Map([
        ['a', 10],
        ['b', 20],
        ['c', 30],
      ]),
    );
  });

  it('can access key and map in transform function', () => {
    // Arrange
    const input = new Map([
      ['x', 2],
      ['y', 3],
    ]);

    // Act
    const result = mapValuesOfMap(
      input,
      (v, k, map) => `${k}:${v}/${map.size}`,
    );

    // Assert
    expect(result).toEqual(
      new Map([
        ['x', 'x:2/2'],
        ['y', 'y:3/2'],
      ]),
    );
  });

  it('returns an empty map when input is empty', () => {
    // Arrange
    const input = new Map<string, number>();

    // Act
    const result = mapValuesOfMap(input, (v) => v * 2);

    // Assert
    expect(result.size).toBe(0);
  });
});
