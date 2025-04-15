import { describe, expect, it } from 'vitest';

import { mapKeyBy } from './key-by.js';

describe('keyBy', () => {
  it('keys strings by their length', () => {
    // Arrange
    const input = ['a', 'bb', 'ccc'];

    // Act
    const keyed = mapKeyBy(input, (s) => s.length);

    // Assert
    expect(keyed).toEqual(
      new Map([
        [1, 'a'],
        [2, 'bb'],
        [3, 'ccc'],
      ]),
    );
  });

  it('handles empty input', () => {
    // Arrange
    const input: string[] = [];

    // Act
    const keyed = mapKeyBy(input, (s) => s.length);

    // Assert
    expect(keyed.size).toBe(0);
  });

  it('overwrites earlier values with later ones when keys collide', () => {
    // Arrange
    const input = ['a', 'b', 'c'];

    // Act
    const keyed = mapKeyBy(input, (s) => s.length);

    // Assert
    expect(keyed).toEqual(new Map([[1, 'c']]));
  });

  it('can key by a constant key', () => {
    // Arrange
    const input = [1, 2, 3];

    // Act
    const keyed = mapKeyBy(input, () => 'all');

    // Assert
    expect(keyed).toEqual(new Map([['all', 3]]));
  });

  it('keys objects by a property', () => {
    // Arrange
    const input = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Charlie' },
    ];

    // Act
    const keyed = mapKeyBy(input, (obj) => obj.id);

    // Assert
    expect(keyed).toEqual(
      new Map([
        [1, { id: 1, name: 'Alice' }],
        [2, { id: 2, name: 'Bob' }],
        [3, { id: 3, name: 'Charlie' }],
      ]),
    );
  });

  it('uses the last item when there are duplicate keys in objects', () => {
    // Arrange
    const input = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 1, name: 'Charlie' }, // Same id as Alice
    ];

    // Act
    const keyed = mapKeyBy(input, (obj) => obj.id);

    // Assert
    expect(keyed).toEqual(
      new Map([
        [1, { id: 1, name: 'Charlie' }], // Charlie overwrites Alice
        [2, { id: 2, name: 'Bob' }],
      ]),
    );
  });
});
