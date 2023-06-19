import { describe, expect, it } from 'vitest';
import { createNonOverwriteableMap } from './index.js';

describe('createNonOverwriteableMap', () => {
  it('generates empty map', () => {
    const map = createNonOverwriteableMap({});
    expect(map.value()).toEqual({});
  });

  it('generates simple map that can be overwritten', () => {
    const map = createNonOverwriteableMap({
      fieldThree: 'valueThree',
    } as { fieldOne?: string; fieldTwo?: string; fieldThree: string });
    map.set('fieldOne', 'valueOneOverride');
    map.merge({ fieldTwo: 'valueTwoOverride' });
    expect(map.value()).toEqual({
      fieldOne: 'valueOneOverride',
      fieldTwo: 'valueTwoOverride',
      fieldThree: 'valueThree',
    });
  });

  it('throws when overwriting a field', () => {
    const map = createNonOverwriteableMap(
      { fieldOne: 'valueOne', fieldTwo: 'valueTwo' },
      { name: 'cool map', defaultsOverwriteable: true }
    );
    map.set('fieldOne', 'valueOneOverride');
    expect(() => map.set('fieldOne', 'valueOneOverride2')).toThrow(
      'Field fieldOne already has value in cool map'
    );
  });

  it('allows overwriting of defaults with defaultsOverwriteable', () => {
    const map = createNonOverwriteableMap(
      {
        fieldOne: 'valueOne',
        fieldTwo: 'valueTwo',
        fieldThree: 'valueThree',
      },
      { defaultsOverwriteable: true }
    );
    map.set('fieldOne', 'valueOneOverride');
    map.merge({ fieldTwo: 'valueTwoOverride' });
    expect(map.value()).toEqual({
      fieldOne: 'valueOneOverride',
      fieldTwo: 'valueTwoOverride',
      fieldThree: 'valueThree',
    });
  });

  it('merges array fields', () => {
    const map = createNonOverwriteableMap(
      { fieldOne: ['a', 'b'], fieldTwo: 'valueTwo' },
      { mergeArraysUniquely: true }
    );
    map.appendUnique('fieldOne', ['b', 'c', 'd']);
    map.appendUnique('fieldOne', ['d', 'e', 'f']);
    expect(map.value()).toEqual({
      fieldOne: ['a', 'b', 'c', 'd', 'e', 'f'],
      fieldTwo: 'valueTwo',
    });
  });
});
