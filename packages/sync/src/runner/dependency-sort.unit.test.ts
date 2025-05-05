import { describe, expect, it } from 'vitest';

import {
  createProviderType,
  createReadOnlyProviderType,
} from '../providers/index.js';
import { getSortedRunSteps } from './dependency-sort.js';
import {
  createDependencyEntry,
  createOutputDependencyEntry,
  createReadOnlyDependencyEntry,
} from './tests/dependency-entry.test-helper.js';
import { buildTestGeneratorTaskEntry } from './tests/factories.test-helper.js';

describe('getSortedRunSteps', () => {
  it('sorts an empty list', () => {
    const result = getSortedRunSteps([], {});
    expect(result.steps).toEqual([]);
  });

  it('sorts a list with a dependency map', () => {
    const entries = [
      buildTestGeneratorTaskEntry({ id: 'entryOne' }),
      buildTestGeneratorTaskEntry({ id: 'entryTwo' }),
      buildTestGeneratorTaskEntry({ id: 'entryThree' }),
    ];
    const dependencyGraphOne = {
      entryOne: {},
      entryTwo: {
        dep: createDependencyEntry({ id: 'entryOne', providerName: 'dep' }),
      },
      entryThree: {
        dep: createDependencyEntry({ id: 'entryTwo', providerName: 'dep' }),
      },
    };
    const dependencyGraphTwo = {
      entryOne: {
        dep: createDependencyEntry({ id: 'entryTwo', providerName: 'dep' }),
      },
      entryTwo: {
        dep: createDependencyEntry({ id: 'entryThree', providerName: 'dep' }),
      },
      entryThree: {},
    };

    const resultOne = getSortedRunSteps(entries, dependencyGraphOne);
    const resultTwo = getSortedRunSteps(entries, dependencyGraphTwo);

    expect(resultOne.steps).toEqual([
      'init|entryOne',
      'init|entryTwo',
      'init|entryThree',
      'build|entryThree',
      'build|entryTwo',
      'build|entryOne',
    ]);

    expect(resultTwo.steps).toEqual([
      'init|entryThree',
      'init|entryTwo',
      'init|entryOne',
      'build|entryOne',
      'build|entryTwo',
      'build|entryThree',
    ]);
  });

  describe('with provider dependencies', () => {
    const providerOne = createProviderType('provider-one');
    const providerTwo = createProviderType('provider-two');
    const outputProvider = createReadOnlyProviderType('output-provider');
    const readOnlyProvider = createProviderType('readonly-provider', {
      isReadOnly: true,
    });

    it('sorts tasks with output provider dependencies correctly', () => {
      const entries = [
        buildTestGeneratorTaskEntry({
          id: 'producer',
          task: {
            outputs: { out: outputProvider.export() },
          },
        }),
        buildTestGeneratorTaskEntry({
          id: 'consumer',
          task: {
            dependencies: { dep: outputProvider.dependency() },
          },
        }),
      ];

      const dependencyMap = {
        producer: {},
        consumer: {
          dep: createOutputDependencyEntry({
            id: 'producer',
            providerName: 'dep',
          }),
        },
      };

      const result = getSortedRunSteps(entries, dependencyMap);
      expect(result.steps).toEqual([
        'init|producer',
        'build|producer', // Must complete build before consumer can start
        'init|consumer',
        'build|consumer',
      ]);
    });

    it('sorts tasks with mixed output and regular provider dependencies', () => {
      const entries = [
        buildTestGeneratorTaskEntry({
          id: 'outputProducer',
          task: {
            outputs: { out: outputProvider.export() },
          },
        }),
        buildTestGeneratorTaskEntry({
          id: 'normalProducer',
          task: {
            exports: { exp: providerOne.export() },
          },
        }),
        buildTestGeneratorTaskEntry({
          id: 'consumer',
          task: {
            dependencies: {
              outDep: outputProvider.dependency(),
              normalDep: providerOne.dependency(),
            },
          },
        }),
      ];

      const dependencyMap = {
        outputProducer: {},
        normalProducer: {},
        consumer: {
          outDep: createOutputDependencyEntry({
            id: 'outputProducer',
            providerName: 'outDep',
          }),
          normalDep: createDependencyEntry({
            id: 'normalProducer',
            providerName: 'normalDep',
          }),
        },
      };

      const result = getSortedRunSteps(entries, dependencyMap);
      expect(result.steps).toEqual([
        'init|normalProducer',
        'init|outputProducer',
        'build|outputProducer',
        'init|consumer',
        'build|consumer',
        'build|normalProducer',
      ]);
    });

    it('sorts tasks with read-only provider dependencies', () => {
      const entries = [
        buildTestGeneratorTaskEntry({
          id: 'producer',
          task: {
            exports: { exp: readOnlyProvider.export() },
          },
        }),
        buildTestGeneratorTaskEntry({
          id: 'consumer',
          task: {
            dependencies: { dep: readOnlyProvider.dependency() },
          },
        }),
      ];

      const dependencyMap = {
        producer: {},
        consumer: {
          dep: createReadOnlyDependencyEntry({
            id: 'producer',
            providerName: 'dep',
          }),
        },
      };

      const result = getSortedRunSteps(entries, dependencyMap);
      expect(result.steps).toEqual([
        'init|producer',
        'init|consumer',
        'build|consumer',
        'build|producer', // Build order doesn't matter for read-only providers
      ]);
    });

    it('handles complex dependency chains with mixed provider types', () => {
      const entries = [
        buildTestGeneratorTaskEntry({
          id: 'outputProducer',
          task: {
            outputs: { out: outputProvider.export() },
          },
        }),
        buildTestGeneratorTaskEntry({
          id: 'middleConsumer',
          task: {
            dependencies: { outDep: outputProvider.dependency() },
            exports: { exp: providerTwo.export() },
          },
        }),
        buildTestGeneratorTaskEntry({
          id: 'finalConsumer',
          task: {
            dependencies: {
              normalDep: providerTwo.dependency(),
              readonlyDep: readOnlyProvider.dependency(),
            },
          },
        }),
        buildTestGeneratorTaskEntry({
          id: 'readonlyProducer',
          task: {
            exports: { exp: readOnlyProvider.export() },
          },
        }),
      ];

      const dependencyMap = {
        outputProducer: {},
        middleConsumer: {
          outDep: createOutputDependencyEntry({
            id: 'outputProducer',
            providerName: 'outDep',
          }),
        },
        finalConsumer: {
          normalDep: createDependencyEntry({
            id: 'middleConsumer',
            providerName: 'normalDep',
          }),
          readonlyDep: createReadOnlyDependencyEntry({
            id: 'readonlyProducer',
            providerName: 'readonlyDep',
          }),
        },
        readonlyProducer: {},
      };

      const result = getSortedRunSteps(entries, dependencyMap);
      expect(result.steps).toEqual([
        'init|readonlyProducer',
        'build|readonlyProducer',
        'init|outputProducer',
        'build|outputProducer',
        'init|middleConsumer',
        'init|finalConsumer',
        'build|finalConsumer',
        'build|middleConsumer',
      ]);
    });
  });
});
