import { createProviderType } from '../provider';
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

  describe('with export inter-dependencies', () => {
    const providerOne = createProviderType('providerOne');
    const providerTwo = createProviderType('providerTwo');

    it('sorts a list with export inter-dependencies', () => {
      const entries = [
        buildTestGeneratorEntry({
          id: 'entryOne',
          exports: {
            exp: providerOne,
            exp2: providerTwo.export().dependsOn(providerOne),
          },
        }),
        buildTestGeneratorEntry({
          id: 'entryTwo',
          dependencies: { dep: providerOne },
        }),
        buildTestGeneratorEntry({
          id: 'entryThree',
          dependencies: { dep: providerTwo },
        }),
        buildTestGeneratorEntry({
          id: 'entryFour',
          dependencies: { dep: providerOne },
        }),
      ];
      const dependencyGraphOne = {
        entryOne: {},
        entryTwo: { dep: 'entryOne' },
        entryThree: { dep: 'entryOne' },
        entryFour: { dep: 'entryOne' },
      };
      const resultOne = getSortedEntryIds(entries, dependencyGraphOne);
      expect(resultOne).toEqual([
        'entryOne',
        'entryTwo',
        'entryFour',
        'entryThree',
      ]);
    });

    it('throws with a generator that depends on inter-dependent providers', () => {
      const entries = [
        buildTestGeneratorEntry({
          id: 'entryOne',
          exports: {
            exp: providerOne,
            exp2: providerTwo.export().dependsOn(providerOne),
          },
        }),
        buildTestGeneratorEntry({
          id: 'entryTwo',
          dependencies: { dep: providerOne, dep2: providerTwo },
        }),
      ];
      const dependencyGraphOne = {
        entryOne: {},
        entryTwo: { dep: 'entryOne', dep2: 'entryOne' },
      };
      expect(() => getSortedEntryIds(entries, dependencyGraphOne)).toThrow(
        'Cyclic dependency'
      );
    });
  });
});
