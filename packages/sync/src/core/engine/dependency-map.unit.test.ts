import { createProviderType } from '../provider';
import {
  buildTaskDependencyMap,
  buildEntryDependencyMapRecursive,
} from './dependency-map';
import {
  buildTestGeneratorEntry,
  buildTestGeneratorTaskEntry,
} from './tests/factories.test-helper';

const providerOne = createProviderType('providerOne');
const providerTwo = createProviderType('providerTwo');

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

    const dependencyMap = buildTaskDependencyMap(entry, parentProviders, {});
    expect(dependencyMap).toEqual({
      dependency: 'parentId#main',
      optionalDependency: null,
    });
  });

  it('should resolve dependencies to resolveToNull to null always', () => {
    const entry = buildTestGeneratorTaskEntry({
      dependencies: {
        dependency: providerOne.dependency().resolveToNull(),
      },
    });

    const parentProviders: Record<string, string> = {
      [providerOne.name]: 'parentId#main',
    };

    const dependencyMap = buildTaskDependencyMap(entry, parentProviders, {});
    expect(dependencyMap).toEqual({ dependency: null });
  });

  it('should resolve reference dependency', () => {
    const entry = buildTestGeneratorTaskEntry({
      dependencies: {
        referenceDependency: providerOne.dependency().reference('dependent'),
      },
    });

    const taskMap = {
      'dependent#main': buildTestGeneratorTaskEntry({
        exports: { export: providerOne },
      }),
    };

    const dependencyMap = buildTaskDependencyMap(entry, {}, taskMap);
    expect(dependencyMap).toEqual({
      referenceDependency: 'dependent#main',
    });
  });

  it('should throw if reference dependent does not implement provider', () => {
    const entry = buildTestGeneratorTaskEntry({
      dependencies: {
        referenceDependency: providerOne.dependency().reference('dependent'),
      },
    });

    const taskMap = {
      'dependent#main': buildTestGeneratorTaskEntry({
        exports: { export: providerTwo },
      }),
    };

    expect(() => buildTaskDependencyMap(entry, {}, taskMap)).toThrow(
      'Could not resolve'
    );
  });
});

describe('buildEntryDependencyMapRecursive', () => {
  it('should generate dependency map of an empty entry', () => {
    const entry = buildTestGeneratorEntry({ id: 'root' });

    const dependencyMap = buildEntryDependencyMapRecursive(entry, {}, {});
    expect(dependencyMap).toEqual({});
  });

  it('should generate dependency map of a nested entry', () => {
    const entry = buildTestGeneratorEntry(
      {
        id: 'root',
        children: [
          buildTestGeneratorEntry(
            { id: 'child' },
            { dependencies: { dep2: providerOne } }
          ),
        ],
      },
      { dependencies: { dep: providerOne }, exports: { provider: providerOne } }
    );

    const dependencyMap = buildEntryDependencyMapRecursive(
      entry,
      { [providerOne.name]: 'parentId#main' },
      {}
    );
    expect(dependencyMap).toEqual({
      'root#main': { dep: 'parentId#main' },
      'child#main': { dep2: 'root#main' },
    });
  });

  it('should generate dependency map with peer provider entry', () => {
    const entry = buildTestGeneratorEntry(
      {
        id: 'root',
        children: [
          buildTestGeneratorEntry(
            { id: 'child' },
            { dependencies: { dep2: providerOne } }
          ),
          buildTestGeneratorEntry(
            {
              id: 'peer',
              descriptor: { generator: 'g', peerProvider: true },
            },
            { exports: { exp: providerOne } }
          ),
        ],
      },
      { exports: { provider: providerOne } }
    );

    const dependencyMap = buildEntryDependencyMapRecursive(
      entry,
      { [providerOne.name]: 'parentId' },
      {}
    );
    expect(dependencyMap).toEqual({
      'root#main': {},
      'peer#main': {},
      'child#main': { dep2: 'peer#main' },
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
                  { exports: { exp: providerTwo } }
                ),
              ],
            },
            {}
          ),
          buildTestGeneratorEntry(
            { id: 'sideDep' },
            { dependencies: { dep2: providerTwo } }
          ),
        ],
      },
      {}
    );

    const dependencyMap = buildEntryDependencyMapRecursive(entry, {}, {});
    expect(dependencyMap).toEqual({
      'root#main': {},
      'child#main': {},
      'grandChild#main': {},
      'sideDep#main': { dep2: 'grandChild#main' },
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
                { exports: { exp: providerTwo } }
              ),
            ],
          },
          { exports: { exp: providerTwo } }
        ),
        buildTestGeneratorEntry(
          {
            id: 'sideDep',
          },
          { dependencies: { dep2: providerTwo } }
        ),
      ],
    });

    expect(() => buildEntryDependencyMapRecursive(entry, {}, {})).toThrow(
      'Duplicate hoisted provider'
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
            { exports: { exp: providerOne } }
          ),
          buildTestGeneratorEntry(
            {
              id: 'peerTwo',
              descriptor: { generator: 'g', peerProvider: true },
            },
            { exports: { expTwo: providerOne } }
          ),
        ],
      },
      { exports: { provider: providerOne } }
    );

    expect(() => buildEntryDependencyMapRecursive(entry, {}, {})).toThrow(
      'Duplicate provider'
    );
  });
});
