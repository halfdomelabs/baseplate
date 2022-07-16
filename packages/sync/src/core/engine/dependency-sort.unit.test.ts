import { createProviderType } from '../provider';
import { getSortedRunSteps } from './dependency-sort';
import { buildTestGeneratorTaskEntry } from './tests/factories.test-helper';

describe('getSortedRunSteps', () => {
  it('sorts an empty list', () => {
    const result = getSortedRunSteps([], {});
    expect(result).toEqual([]);
  });

  it('sorts a list with a dependency map', () => {
    const entries = [
      buildTestGeneratorTaskEntry({ id: 'entryOne' }),
      buildTestGeneratorTaskEntry({ id: 'entryTwo' }),
      buildTestGeneratorTaskEntry({ id: 'entryThree' }),
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
        buildTestGeneratorTaskEntry({
          id: 'entryOne',
          exports: {
            exp: providerOne,
            exp2: providerTwo.export().dependsOn(providerOne),
          },
        }),
        buildTestGeneratorTaskEntry({
          id: 'entryTwo',
          dependencies: { dep: providerOne },
        }),
        buildTestGeneratorTaskEntry({
          id: 'entryThree',
          dependencies: { dep: providerTwo },
        }),
        buildTestGeneratorTaskEntry({
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
        buildTestGeneratorTaskEntry({
          id: 'entryOne',
          exports: {
            exp: providerOne,
            exp2: providerTwo.export().dependsOn(providerOne),
            exp3: providerThree.export().dependsOn(providerTwo),
          },
        }),
        buildTestGeneratorTaskEntry({
          id: 'entryTwo',
          dependencies: { dep: providerOne },
        }),
        buildTestGeneratorTaskEntry({
          id: 'entryThree',
          dependencies: { dep: providerThree },
        }),
        buildTestGeneratorTaskEntry({
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
        buildTestGeneratorTaskEntry({
          id: 'entryOne',
          exports: {
            exp: providerOne,
            exp2: providerTwo.export().dependsOn(providerOne),
          },
        }),
        buildTestGeneratorTaskEntry({
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

  describe('with inter-dependent tasks', () => {
    const providerOne = createProviderType('providerOne');
    const providerTwo = createProviderType('providerTwo');
    const providerThree = createProviderType('providerThree');

    it('sorts a list with task inter-dependencies', () => {
      const entries = [
        buildTestGeneratorTaskEntry({
          id: 'entryOne#exp',
          exports: { exp: providerOne },
        }),
        buildTestGeneratorTaskEntry({
          id: 'entryOne#exp2',
          exports: { exp2: providerTwo },
          taskDependencies: ['entryOne#exp'],
        }),
        buildTestGeneratorTaskEntry({
          id: 'entryTwo',
          dependencies: { dep: providerOne },
        }),
        buildTestGeneratorTaskEntry({
          id: 'entryThree',
          dependencies: { dep: providerTwo },
        }),
        buildTestGeneratorTaskEntry({
          id: 'entryFour',
          dependencies: { dep: providerOne },
        }),
      ];
      const dependencyGraphOne = {
        'entryOne#exp': {},
        'entryOne#exp2': {},
        entryTwo: { dep: 'entryOne#exp' },
        entryThree: { dep: 'entryOne#exp2' },
        entryFour: { dep: 'entryOne#exp' },
      };
      const resultOne = getSortedRunSteps(entries, dependencyGraphOne);
      expect(resultOne).toEqual([
        'init|entryOne#exp',
        'init|entryTwo',
        'build|entryTwo',
        'init|entryFour',
        'build|entryFour',
        'build|entryOne#exp',
        'init|entryOne#exp2',
        'init|entryThree',
        'build|entryThree',
        'build|entryOne#exp2',
      ]);
    });

    it('sorts a list with two layers of task inter-dependencies', () => {
      const entries = [
        buildTestGeneratorTaskEntry({
          id: 'entryOne#exp',
          exports: { exp: providerOne },
        }),
        buildTestGeneratorTaskEntry({
          id: 'entryOne#exp2',
          exports: { exp2: providerTwo },
          taskDependencies: ['entryOne#exp'],
        }),
        buildTestGeneratorTaskEntry({
          id: 'entryOne#exp3',
          exports: { exp3: providerThree },
          taskDependencies: ['entryOne#exp2'],
        }),
        buildTestGeneratorTaskEntry({
          id: 'entryTwo',
          dependencies: { dep: providerOne },
        }),
        buildTestGeneratorTaskEntry({
          id: 'entryThree',
          dependencies: { dep: providerThree },
        }),
        buildTestGeneratorTaskEntry({
          id: 'entryFour',
          dependencies: { dep: providerOne },
        }),
      ];
      const dependencyGraphOne = {
        'entryOne#exp': {},
        'entryOne#exp2': {},
        'entryOne#exp3': {},
        entryTwo: { dep: 'entryOne#exp' },
        entryThree: { dep: 'entryOne#exp3' },
        entryFour: { dep: 'entryOne#exp' },
      };
      const resultOne = getSortedRunSteps(entries, dependencyGraphOne);
      expect(resultOne).toEqual([
        'init|entryOne#exp',
        'init|entryTwo',
        'build|entryTwo',
        'init|entryFour',
        'build|entryFour',
        'build|entryOne#exp',
        'init|entryOne#exp2',
        'build|entryOne#exp2',
        'init|entryOne#exp3',
        'init|entryThree',
        'build|entryThree',
        'build|entryOne#exp3',
      ]);
    });

    it('throws with a task that depends on inter-dependent providers', () => {
      const entries = [
        buildTestGeneratorTaskEntry({
          id: 'entryOne#exp',
          exports: { exp: providerOne },
        }),
        buildTestGeneratorTaskEntry({
          id: 'entryOne#exp2',
          exports: { exp2: providerTwo },
          taskDependencies: ['entryOne#exp'],
        }),
        buildTestGeneratorTaskEntry({
          id: 'entryTwo',
          dependencies: { dep: providerOne, dep2: providerTwo },
        }),
      ];
      const dependencyGraphOne = {
        'entryOne#exp': {},
        'entryOne#exp2': {},
        entryTwo: { dep: 'entryOne#exp', dep2: 'entryOne#exp2' },
      };
      expect(() => getSortedRunSteps(entries, dependencyGraphOne)).toThrow(
        'Cyclic dependency'
      );
    });
  });
});
