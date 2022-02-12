import { createNonOverwriteableMap } from '.';

describe('createNonOverwriteableMap', () => {
  it('generates empty map', () => {
    const map = createNonOverwriteableMap({});
    expect(map.value()).toEqual({});
  });

  it('generates simple map that can be overwritten', () => {
    const map = createNonOverwriteableMap({
      fieldOne: 'valueOne',
      fieldTwo: 'valueTwo',
      fieldThree: 'valueThree',
    });
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
      { name: 'cool map' }
    );
    map.set('fieldOne', 'valueOneOverride');
    expect(() => map.set('fieldOne', 'valueOneOverride2')).toThrow(
      'Field fieldOne already has value in cool map'
    );
  });

  it('merges array fields', () => {
    const map = createNonOverwriteableMap(
      { fieldOne: ['a', 'b'], fieldTwo: 'valueTwo' },
      { mergeArraysUniquely: true }
    );
    map.appendUnique('fieldOne', ['b', 'c']);
    map.appendUnique('fieldOne', ['c', 'd']);
    expect(map.value()).toEqual({
      fieldOne: ['a', 'b', 'c', 'd'],
      fieldTwo: 'valueTwo',
    });
  });
});
