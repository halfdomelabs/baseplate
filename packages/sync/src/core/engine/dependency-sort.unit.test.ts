import { getSortedEntryIds } from './dependency-sort';
import { buildTestGeneratorEntry } from './tests/factories.test-helper';

describe('getSortedEntryIds', () => {
  it('sorts an empty list', () => {
    const result = getSortedEntryIds([], {});
    expect(result).toEqual([]);
  });

  it('sorts a list with a dependency map', () => {
    const entries = [
      buildTestGeneratorEntry({ id: 'entryOne' }),
      buildTestGeneratorEntry({ id: 'entryTwo' }),
      buildTestGeneratorEntry({ id: 'entryThree' }),
    ];
    const dependencyGraphOne = {
      entryOne: {},
      entryTwo: { dep: 'entryOne' },
      entryThree: { dep: 'entryTwo' },
    };
    const resultOne = getSortedEntryIds(entries, dependencyGraphOne);
    expect(resultOne).toEqual(['entryOne', 'entryTwo', 'entryThree']);

    const dependencyGraphTwo = {
      entryOne: { dep: 'entryTwo' },
      entryTwo: { dep: 'entryThree' },
      entryThree: {},
    };
    const resultTwo = getSortedEntryIds(entries, dependencyGraphTwo);
    expect(resultTwo).toEqual(['entryThree', 'entryTwo', 'entryOne']);
  });
});
