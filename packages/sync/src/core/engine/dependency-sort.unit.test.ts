import { createProviderType } from '../provider';
import { getSortedRunSteps } from './dependency-sort';
import { buildTestGeneratorEntry } from './tests/factories.test-helper';

describe('getSortedRunSteps', () => {
  it('sorts an empty list', () => {
    const result = getSortedRunSteps([], {});
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

    const dependencyGraphTwo = {
      entryOne: { dep: 'entryTwo' },
      entryTwo: { dep: 'entryThree' },
      entryThree: {},
    };

    const resultOne = getSortedRunSteps(entries, dependencyGraphOne);
    const resultTwo = getSortedRunSteps(entries, dependencyGraphTwo);

    expect(resultOne).toEqual([
      'init|entryOne',
      'init|entryTwo',
      'init|entryThree',
      'build|entryThree',
      'build|entryTwo',
      'build|entryOne',
    ]);

    expect(resultTwo).toEqual([
      'init|entryThree',
      'init|entryTwo',
      'init|entryOne',
      'build|entryOne',
      'build|entryTwo',
      'build|entryThree',
    ]);
  });

  describe('with export inter-dependencies', () => {
    const providerOne = createProviderType('providerOne');
    const providerTwo = createProviderType('providerTwo');
    const providerThree = createProviderType('providerThree');

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
      const resultOne = getSortedRunSteps(entries, dependencyGraphOne);
      expect(resultOne).toEqual([
        'init|entryOne',
        'init|entryTwo',
        'build|entryTwo',
        'init|entryFour',
        'build|entryFour',
        'init|entryThree',
        'build|entryThree',
        'build|entryOne',
      ]);
    });

    it('sorts a list with two layers of export inter-dependencies', () => {
      const entries = [
        buildTestGeneratorEntry({
          id: 'entryOne',
          exports: {
            exp: providerOne,
            exp2: providerTwo.export().dependsOn(providerOne),
            exp3: providerThree.export().dependsOn(providerTwo),
          },
        }),
        buildTestGeneratorEntry({
          id: 'entryTwo',
          dependencies: { dep: providerOne },
        }),
        buildTestGeneratorEntry({
          id: 'entryThree',
          dependencies: { dep: providerThree },
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
      const resultOne = getSortedRunSteps(entries, dependencyGraphOne);
      expect(resultOne).toEqual([
        'init|entryOne',
        'init|entryTwo',
        'build|entryTwo',
        'init|entryFour',
        'build|entryFour',
        'init|entryThree',
        'build|entryThree',
        'build|entryOne',
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
      expect(() => getSortedRunSteps(entries, dependencyGraphOne)).toThrow(
        'Cyclic dependency'
      );
    });
  });
});
