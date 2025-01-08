import { describe, expect, it } from 'vitest';

import { createEventedLogger } from '@src/utils/index.js';

import { createProviderType } from '../provider.js';
import {
  buildTaskDependencyMap,
  resolveTaskDependencies,
} from './dependency-map.js';
import {
  buildTestGeneratorEntry,
  buildTestGeneratorTaskEntry,
} from './tests/factories.test-helper.js';

const providerOne = createProviderType('providerOne');
const providerTwo = createProviderType('providerTwo');

const testLogger = createEventedLogger({ noConsole: true });

const emptyGeneratorCache = {
  globalExportIdToTaskId: {},
};

describe('buildEntryDependencyMap', () => {
  it('should resolve basic dependency map', () => {
    const entry = buildTestGeneratorTaskEntry({
      dependencies: {
        dependency: providerOne,
        optionalDependency: providerTwo.dependency().optional(),
      },
    });

    const parentProviders: Record<string, string> = {
      [providerOne.name]: 'parentId#main',
    };

    const dependencyMap = buildTaskDependencyMap(
      entry,
      parentProviders,
      emptyGeneratorCache,
    );
    expect(dependencyMap).toEqual({
      dependency: { id: 'parentId#main', options: {} },
      optionalDependency: null,
    });
  });

  it('should resolve reference dependency', () => {
    const entry = buildTestGeneratorTaskEntry({
      dependencies: {
        referenceDependency: providerOne.dependency().reference('dependent'),
      },
    });

    const generatorCache = {
      globalExportIdToTaskId: {
        'dependent#providerOne': 'dependent#main',
      },
    };

    const dependencyMap = buildTaskDependencyMap(entry, {}, generatorCache);
    expect(dependencyMap).toEqual({
      referenceDependency: {
        id: 'dependent#main',
        options: { reference: 'dependent', resolutionMode: 'explicit' },
      },
    });
  });

  it('should throw if reference dependent does not implement provider', () => {
    const entry = buildTestGeneratorTaskEntry({
      dependencies: {
        referenceDependency: providerOne.dependency().reference('dependent'),
      },
    });

    const generatorCache = {
      globalExportIdToTaskId: {
        'dependent#providerTwo': 'dependent#main',
      },
    };

    expect(() => buildTaskDependencyMap(entry, {}, generatorCache)).toThrow(
      'Could not resolve',
    );
  });
});

describe('resolveTaskDependencies', () => {
  it('should generate dependency map of an empty entry', () => {
    const entry = buildTestGeneratorEntry({ id: 'root' });

    const dependencyMap = resolveTaskDependencies(entry, testLogger);
    expect(dependencyMap).toEqual({});
  });

  it('should generate dependency map of a nested entry', () => {
    const entry = buildTestGeneratorEntry(
      {
        id: 'root',
        children: [
          buildTestGeneratorEntry(
            { id: 'child' },
            { dependencies: { dep2: providerOne } },
          ),
        ],
      },
      {
        exports: { provider: providerOne },
      },
    );

    const dependencyMap = resolveTaskDependencies(entry, testLogger);
    expect(dependencyMap).toEqual({
      'child#main': { dep2: { id: 'root#main', options: {} } },
      'root#main': {},
    });
  });

  it('should generate dependency map with peer provider entry', () => {
    const entry = buildTestGeneratorEntry(
      {
        id: 'root',
        children: [
          buildTestGeneratorEntry(
            { id: 'child' },
            { dependencies: { dep2: providerOne } },
          ),
          buildTestGeneratorEntry(
            {
              id: 'peer',
              descriptor: { generator: 'g', peerProvider: true },
            },
            { exports: { exp: providerOne } },
          ),
        ],
      },
      { exports: { provider: providerOne } },
    );

    const dependencyMap = resolveTaskDependencies(entry, testLogger);
    expect(dependencyMap).toEqual({
      'root#main': {},
      'peer#main': {},
      'child#main': { dep2: { id: 'peer#main', options: {} } },
    });
  });

  it('should generate dependency map with hoisted provider', () => {
    const entry = buildTestGeneratorEntry(
      {
        id: 'root',
        descriptor: { generator: 'g', hoistedProviders: [providerTwo.name] },
        children: [
          buildTestGeneratorEntry(
            {
              id: 'child',
              children: [
                buildTestGeneratorEntry(
                  { id: 'grandChild' },
                  { exports: { exp: providerTwo } },
                ),
              ],
            },
            {},
          ),
          buildTestGeneratorEntry(
            { id: 'sideDep' },
            { dependencies: { dep2: providerTwo } },
          ),
        ],
      },
      {},
    );

    const dependencyMap = resolveTaskDependencies(entry, testLogger);
    expect(dependencyMap).toEqual({
      'root#main': {},
      'child#main': {},
      'grandChild#main': {},
      'sideDep#main': {
        dep2: { id: 'grandChild#main', options: {} },
      },
    });
  });

  it('should throw if multiple hoisted providers exist with same provider export', () => {
    const entry = buildTestGeneratorEntry({
      id: 'root',
      descriptor: { generator: 'g', hoistedProviders: [providerTwo.name] },
      children: [
        buildTestGeneratorEntry(
          {
            id: 'child',
            children: [
              buildTestGeneratorEntry(
                { id: 'grandChild' },
                { exports: { exp: providerTwo } },
              ),
            ],
          },
          { exports: { exp: providerTwo } },
        ),
        buildTestGeneratorEntry(
          {
            id: 'sideDep',
          },
          { dependencies: { dep2: providerTwo } },
        ),
      ],
    });

    expect(() => resolveTaskDependencies(entry, testLogger)).toThrow(
      'Duplicate hoisted provider',
    );
  });

  it('should throw if multiple peer providers exist with same provider export', () => {
    const entry = buildTestGeneratorEntry(
      {
        id: 'root',
        children: [
          buildTestGeneratorEntry(
            {
              id: 'peerOne',
              descriptor: { generator: 'g', peerProvider: true },
            },
            { exports: { exp: providerOne } },
          ),
          buildTestGeneratorEntry(
            {
              id: 'peerTwo',
              descriptor: { generator: 'g', peerProvider: true },
            },
            { exports: { expTwo: providerOne } },
          ),
        ],
      },
      { exports: { provider: providerOne } },
    );

    expect(() => resolveTaskDependencies(entry, testLogger)).toThrow(
      'Duplicate provider',
    );
  });
});
