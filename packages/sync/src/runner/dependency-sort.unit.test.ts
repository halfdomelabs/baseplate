import { describe, expect, it } from 'vitest';

import {
  createOutputProviderType,
  createProviderType,
} from '../providers/index.js';
import { getSortedRunSteps } from './dependency-sort.js';
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
      entryTwo: { dep: { id: 'entryOne', providerName: 'dep', options: {} } },
      entryThree: { dep: { id: 'entryTwo', providerName: 'dep', options: {} } },
    };

    const dependencyGraphTwo = {
      entryOne: { dep: { id: 'entryTwo', providerName: 'dep', options: {} } },
      entryTwo: { dep: { id: 'entryThree', providerName: 'dep', options: {} } },
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
    const outputProvider = createOutputProviderType('output-provider');
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
          dep: {
            id: 'producer',
            providerName: 'dep',
            options: { isOutput: true },
          },
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
          outDep: {
            id: 'outputProducer',
            providerName: 'outDep',
            options: { isOutput: true },
          },
          normalDep: {
            id: 'normalProducer',
            providerName: 'normalDep',
            options: {},
          },
        },
      };

      const result = getSortedRunSteps(entries, dependencyMap);
      expect(result.steps).toEqual([
        'init|outputProducer',
        'build|outputProducer',
        'init|normalProducer',
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
          dep: {
            id: 'producer',
            providerName: 'dep',
            options: { isReadOnly: true },
          },
        },
      };

      const result = getSortedRunSteps(entries, dependencyMap);
      expect(result.steps).toEqual([
        'init|producer',
        'build|producer', // Build order doesn't matter for read-only providers
        'init|consumer',
        'build|consumer',
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
          outDep: {
            id: 'outputProducer',
            providerName: 'outDep',
            options: { isOutput: true },
          },
        },
        finalConsumer: {
          normalDep: {
            id: 'middleConsumer',
            providerName: 'normalDep',
            options: {},
          },
          readonlyDep: {
            id: 'readonlyProducer',
            providerName: 'readonlyDep',
            options: { isReadOnly: true },
          },
        },
        readonlyProducer: {},
      };

      const result = getSortedRunSteps(entries, dependencyMap);
      expect(result.steps).toEqual([
        'init|outputProducer',
        'build|outputProducer',
        'init|middleConsumer',
        'init|readonlyProducer',
        'init|finalConsumer',
        'build|finalConsumer',
        'build|middleConsumer',
        'build|readonlyProducer',
      ]);
    });
  });
});
