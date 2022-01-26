import { createProviderType } from '../provider';
import {
  buildEntryDependencyMap,
  buildEntryDependencyMapRecursive,
} from './dependency-map';
import { buildTestGeneratorEntry } from './tests/factories.test-helper';

const providerOne = createProviderType('providerOne');
const providerTwo = createProviderType('providerTwo');

describe('buildEntryDependencyMap', () => {
  it('should resolve basic dependency map', () => {
    const entry = buildTestGeneratorEntry({
      dependencies: {
        dependency: providerOne,
        optionalDependency: providerTwo.dependency().optional(),
      },
    });

    const parentProviders: Record<string, string> = {
      [providerOne.name]: 'parentId',
    };

    const dependencyMap = buildEntryDependencyMap(entry, parentProviders, {});
    expect(dependencyMap).toEqual({
      dependency: 'parentId',
      optionalDependency: null,
    });
  });

  it('should resolve reference dependency', () => {
    const entry = buildTestGeneratorEntry({
      dependencies: {
        referenceDependency: providerOne.dependency().reference('dependent'),
      },
    });

    const generatorMap = {
      dependent: buildTestGeneratorEntry({ exports: { export: providerOne } }),
    };

    const dependencyMap = buildEntryDependencyMap(entry, {}, generatorMap);
    expect(dependencyMap).toEqual({
      referenceDependency: 'dependent',
    });
  });

  it('should throw if reference dependent does not implement provider', () => {
    const entry = buildTestGeneratorEntry({
      dependencies: {
        referenceDependency: providerOne.dependency().reference('dependent'),
      },
    });

    const generatorMap = {
      dependent: buildTestGeneratorEntry({ exports: { export: providerTwo } }),
    };

    expect(() => buildEntryDependencyMap(entry, {}, generatorMap)).toThrow(
      'does not implement'
    );
  });
});

describe('buildEntryDependencyMapRecursive', () => {
  it('should generate dependency map of an empty entry', () => {
    const entry = buildTestGeneratorEntry({ id: 'root' });

    const dependencyMap = buildEntryDependencyMapRecursive(entry, {}, {});
    expect(dependencyMap).toEqual({ root: {} });
  });

  it('should generate dependency map of a nested entry', () => {
    const entry = buildTestGeneratorEntry({
      id: 'root',
      children: [
        buildTestGeneratorEntry({
          id: 'child',
          dependencies: { dep2: providerOne },
        }),
      ],
      dependencies: { dep: providerOne },
      exports: {
        provider: providerOne,
      },
    });

    const dependencyMap = buildEntryDependencyMapRecursive(
      entry,
      { [providerOne.name]: 'parentId' },
      {}
    );
    expect(dependencyMap).toEqual({
      root: { dep: 'parentId' },
      child: { dep2: 'root' },
    });
  });

  it('should generate dependency map with peer provider entry', () => {
    const entry = buildTestGeneratorEntry({
      id: 'root',
      children: [
        buildTestGeneratorEntry({
          id: 'child',
          dependencies: { dep2: providerOne },
        }),
        buildTestGeneratorEntry({
          id: 'peer',
          descriptor: { generator: 'g', peerProvider: true },
          exports: { exp: providerOne },
        }),
      ],
      exports: { provider: providerOne },
    });

    const dependencyMap = buildEntryDependencyMapRecursive(
      entry,
      { [providerOne.name]: 'parentId' },
      {}
    );
    expect(dependencyMap).toEqual({
      root: {},
      child: { dep2: 'peer' },
      peer: {},
    });
  });

  it('should throw if multiple peer providers exist with same provider export', () => {
    const entry = buildTestGeneratorEntry({
      id: 'root',
      children: [
        buildTestGeneratorEntry({
          id: 'peerOne',
          descriptor: { generator: 'g', peerProvider: true },
          exports: { exp: providerOne },
        }),
        buildTestGeneratorEntry({
          id: 'peerTwo',
          descriptor: { generator: 'g', peerProvider: true },
          exports: { expTwo: providerOne },
        }),
      ],
      exports: { provider: providerOne },
    });

    expect(() => buildEntryDependencyMapRecursive(entry, {}, {})).toThrow(
      'Duplicate provider'
    );
  });
});
