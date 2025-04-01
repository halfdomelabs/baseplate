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
      entryTwo: { dep: { id: 'entryOne', options: {} } },
      entryThree: { dep: { id: 'entryTwo', options: {} } },
    };

    const dependencyGraphTwo = {
      entryOne: { dep: { id: 'entryTwo' } },
      entryTwo: { dep: { id: 'entryThree' } },
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
          outputs: { out: outputProvider.export() },
        }),
        buildTestGeneratorTaskEntry({
          id: 'consumer',
          dependencies: { dep: outputProvider.dependency() },
        }),
      ];

      const dependencyMap = {
        producer: {},
        consumer: { dep: { id: 'producer', options: { isOutput: true } } },
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
          outputs: { out: outputProvider.export() },
        }),
        buildTestGeneratorTaskEntry({
          id: 'normalProducer',
          exports: { exp: providerOne.export() },
        }),
        buildTestGeneratorTaskEntry({
          id: 'consumer',
          dependencies: {
            outDep: outputProvider.dependency(),
            normalDep: providerOne.dependency(),
          },
        }),
      ];

      const dependencyMap = {
        outputProducer: {},
        normalProducer: {},
        consumer: {
          outDep: { id: 'outputProducer', options: { isOutput: true } },
          normalDep: { id: 'normalProducer', options: {} },
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
          exports: { exp: readOnlyProvider.export() },
        }),
        buildTestGeneratorTaskEntry({
          id: 'consumer',
          dependencies: { dep: readOnlyProvider.dependency() },
        }),
      ];

      const dependencyMap = {
        producer: {},
        consumer: { dep: { id: 'producer', options: { isReadOnly: true } } },
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
          outputs: { out: outputProvider.export() },
        }),
        buildTestGeneratorTaskEntry({
          id: 'middleConsumer',
          dependencies: { outDep: outputProvider.dependency() },
          exports: { exp: providerTwo.export() },
        }),
        buildTestGeneratorTaskEntry({
          id: 'finalConsumer',
          dependencies: {
            normalDep: providerTwo.dependency(),
            readonlyDep: readOnlyProvider.dependency(),
          },
        }),
        buildTestGeneratorTaskEntry({
          id: 'readonlyProducer',
          exports: { exp: readOnlyProvider.export() },
        }),
      ];

      const dependencyMap = {
        outputProducer: {},
        middleConsumer: {
          outDep: { id: 'outputProducer', options: { isOutput: true } },
        },
        finalConsumer: {
          normalDep: { id: 'middleConsumer', options: {} },
          readonlyDep: {
            id: 'readonlyProducer',
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
