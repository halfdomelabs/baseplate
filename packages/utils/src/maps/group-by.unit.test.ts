import { describe, expect, it } from 'vitest';

import { mapGroupBy } from './group-by.js';

describe('groupBy', () => {
  it('groups strings by their length', () => {
    // Arrange
    const input = ['a', 'b', 'aa', 'bb', 'ccc'];

    // Act
    const grouped = mapGroupBy(input, (s) => s.length);

    // Assert
    expect(grouped).toEqual(
      new Map([
        [1, ['a', 'b']],
        [2, ['aa', 'bb']],
        [3, ['ccc']],
      ]),
    );
  });

  it('handles empty input', () => {
    // Arrange
    const input: string[] = [];

    // Act
    const grouped = mapGroupBy(input, (s) => s.length);

    // Assert
    expect(grouped.size).toBe(0);
  });

  it('can group by a constant key', () => {
    // Arrange
    const input = [1, 2, 3];

    // Act
    const grouped = mapGroupBy(input, () => 'all');

    // Assert
    expect(grouped).toEqual(new Map([['all', [1, 2, 3]]]));
  });

  it('groups objects by a property', () => {
    // Arrange
    const input = [
      { name: 'a', type: 'x' },
      { name: 'b', type: 'y' },
      { name: 'c', type: 'x' },
    ];

    // Act
    const grouped = mapGroupBy(input, (obj) => obj.type);

    // Assert
    expect(grouped).toEqual(
      new Map([
        [
          'x',
          [
            { name: 'a', type: 'x' },
            { name: 'c', type: 'x' },
          ],
        ],
        ['y', [{ name: 'b', type: 'y' }]],
      ]),
    );
  });
});
