import { describe, expect, it } from 'vitest';

import type {
  GeneratorEntry,
  GeneratorTaskEntry,
} from '@src/generators/build-generator-entry.js';
import type { TaskPhase } from '@src/phases/types.js';

import type { EntryDependencyMap } from './dependency-map.js';

import {
  createProviderExportScope,
  createProviderType,
  createReadOnlyProviderType,
} from '../providers/index.js';
import {
  buildGeneratorIdToScopesMap,
  resolveTaskDependenciesForPhase,
} from './dependency-map.js';
import {
  createDependencyEntry,
  createOutputDependencyEntry,
  createReadOnlyDependencyEntry,
} from './tests/dependency-entry.test-helper.js';
import {
  buildTestGeneratorEntry,
  buildTestGeneratorTaskEntry,
} from './tests/factories.test-helper.js';

const providerOne = createProviderType('provider-one');
const providerTwo = createProviderType('provider-two');
const readOnlyProvider = createReadOnlyProviderType('read-only-provider');

// Create test scopes
const defaultScope = createProviderExportScope(
  'default/test',
  'Default test scope',
);
const scope1 = createProviderExportScope('scope-1/test', 'First test scope');
const scope2 = createProviderExportScope('scope-2/test', 'Second test scope');
const middleScope = createProviderExportScope(
  'middle/test',
  'Middle level test scope',
);

// Create test phases
const phase1: TaskPhase = {
  name: 'phase1',
  options: {},
};
const phase2: TaskPhase = {
  name: 'phase2',
  options: {
    consumesOutputFrom: [phase1],
  },
};

function resolveTaskDependencies(
  entry: GeneratorEntry,
  phase?: TaskPhase,
  dynamicTaskEntries?: Map<string, GeneratorTaskEntry[]>,
): EntryDependencyMap {
  const generatorIdToScopesMap = buildGeneratorIdToScopesMap(entry);
  return resolveTaskDependenciesForPhase(
    entry,
    generatorIdToScopesMap,
    phase,
    dynamicTaskEntries,
  );
}

describe('resolveTaskDependenciesForPhase', () => {
  it('should resolve basic readonly dependencies in a single scope', () => {
    // Arrange
    const entry = buildTestGeneratorEntry(
      {
        id: 'root',
        scopes: [defaultScope],
      },
      {
        exports: {
          provider: readOnlyProvider.export(defaultScope),
        },
      },
    );

    const childEntry = buildTestGeneratorEntry(
      {
        id: 'child',
        scopes: [defaultScope],
      },
      {
        dependencies: { dep: readOnlyProvider.dependency() },
      },
    );

    entry.children.push(childEntry);

    // Act
    const dependencyMap = resolveTaskDependencies(entry);

    // Assert
    expect(dependencyMap).toEqual({
      'root#main': {},
      'child#main': {
        dep: createReadOnlyDependencyEntry({
          id: 'root#main',
          providerName: readOnlyProvider.name,
        }),
      },
    });
  });

  it('should handle optional dependencies', () => {
    // Arrange
    const entry = buildTestGeneratorEntry({
      id: 'root',
      scopes: [defaultScope],
    });

    const childEntry = buildTestGeneratorEntry(
      {
        id: 'child',
        scopes: [defaultScope],
      },
      {
        dependencies: {
          optionalDep: providerOne.dependency().optional(),
        },
      },
    );

    entry.children.push(childEntry);

    // Act
    const dependencyMap = resolveTaskDependencies(entry);

    // Assert
    expect(dependencyMap).toEqual({
      'child#main': {
        optionalDep: undefined,
      },
    });
  });

  it('should handle multiple scopes correctly', () => {
    // Arrange
    const entry = buildTestGeneratorEntry(
      {
        id: 'root',
        scopes: [scope1, scope2],
      },
      {
        exports: {
          provider1: providerOne.export(scope1),
          provider2: providerTwo.export(scope2),
        },
      },
    );

    const child1 = buildTestGeneratorEntry(
      {
        id: 'child1',
      },
      {
        dependencies: { dep: providerOne.dependency() },
      },
    );

    const child2 = buildTestGeneratorEntry(
      {
        id: 'child2',
      },
      {
        dependencies: { dep: providerTwo.dependency() },
      },
    );

    entry.children.push(child1, child2);

    // Act
    const dependencyMap = resolveTaskDependencies(entry);

    // Assert
    expect(dependencyMap).toEqual({
      'root#main': {},
      'child1#main': {
        dep: createDependencyEntry({
          id: 'root#main',
          providerName: providerOne.name,
        }),
      },
      'child2#main': {
        dep: createDependencyEntry({
          id: 'root#main',
          providerName: providerTwo.name,
        }),
      },
    });
  });

  it('should handle a export with multiple exports correctly', () => {
    // Arrange
    const entry = buildTestGeneratorEntry(
      {
        id: 'root',
        scopes: [scope1, scope2],
      },
      {
        exports: {
          provider1: providerOne.export(scope1).andExport(scope2, 'provider1'),
        },
      },
    );

    const child1 = buildTestGeneratorEntry(
      {
        id: 'child1',
      },
      {
        dependencies: { dep: providerOne.dependency() },
      },
    );

    const child2 = buildTestGeneratorEntry(
      {
        id: 'child2',
      },
      {
        dependencies: { dep: providerOne.dependency().reference('provider1') },
      },
    );

    entry.children.push(child1, child2);

    // Act
    const dependencyMap = resolveTaskDependencies(entry);

    // Assert
    expect(dependencyMap).toEqual({
      'root#main': {},
      'child1#main': {
        dep: createDependencyEntry({
          id: 'root#main',
          providerName: providerOne.name,
        }),
      },
      'child2#main': {
        dep: createDependencyEntry({
          id: 'root#main',
          providerName: providerOne.name,
        }),
      },
    });
  });

  it('should handle default scopes correctly', () => {
    // Arrange
    const rootEntry = buildTestGeneratorEntry(
      {
        id: 'root',
        scopes: [scope1],
      },
      {
        exports: {
          // Export to scope1
          provider1: providerOne.export(scope1),
        },
      },
    );

    const middleEntry = buildTestGeneratorEntry(
      {
        id: 'middle',
      },
      {
        exports: {
          // Export only to default scope of children
          provider2: providerOne.export(),
        },
      },
    );

    const leafEntry = buildTestGeneratorEntry(
      {
        id: 'leaf',
      },
      {
        dependencies: {
          // Should resolve to root's provider2 since it's in the default scope of middle
          dep1: providerOne.dependency(),
        },
      },
    );

    middleEntry.children.push(leafEntry);
    rootEntry.children.push(middleEntry);

    // Act
    const dependencyMap = resolveTaskDependencies(rootEntry);

    // Assert
    expect(dependencyMap).toEqual({
      'root#main': {},
      'middle#main': {},
      'leaf#main': {
        dep1: createDependencyEntry({
          id: 'middle#main',
          providerName: providerOne.name,
        }),
      },
    });
  });

  it('should handle providers with custom export names', () => {
    // Arrange
    const entry = buildTestGeneratorEntry(
      {
        id: 'root',
        scopes: [defaultScope],
      },
      {
        exports: {
          defaultProvider: providerOne.export(defaultScope),
        },
      },
    );

    const childEntry = buildTestGeneratorEntry(
      {
        id: 'child',
      },
      {
        dependencies: {
          dep: providerOne.dependency().reference('custom'),
        },
      },
    );

    const peerEntry = buildTestGeneratorEntry(
      {
        id: 'peer',
      },
      {
        exports: {
          customProvider: providerOne.export(defaultScope, 'custom'),
        },
      },
    );

    entry.children.push(childEntry, peerEntry);

    // Act
    const dependencyMap = resolveTaskDependencies(entry);

    // Assert
    expect(dependencyMap).toEqual({
      'root#main': {},
      'child#main': {
        dep: createDependencyEntry({
          id: 'peer#main',
          providerName: providerOne.name,
        }),
      },
      'peer#main': {},
    });
  });

  it('should throw error on duplicate provider exports within same scope', () => {
    // Arrange
    const entry = buildTestGeneratorEntry(
      {
        id: 'root',
        scopes: [defaultScope],
      },
      {
        exports: {
          provider1: providerOne.export(defaultScope),
          provider2: providerOne.export(defaultScope), // Same provider in same scope
        },
      },
    );

    // Act
    expect(() => resolveTaskDependencies(entry)).toThrow(
      /Duplicate scoped provider export detected/,
    );
  });

  it('should throw error when required provider is not found', () => {
    // Arrange
    const entry = buildTestGeneratorEntry({
      id: 'root',
      scopes: [defaultScope],
    });

    const childEntry = buildTestGeneratorEntry(
      {
        id: 'child',
        scopes: [defaultScope],
      },
      {
        dependencies: {
          dep: providerOne.dependency(), // Required dependency
        },
      },
    );

    entry.children.push(childEntry);

    // Act
    expect(() => resolveTaskDependencies(entry)).toThrow(
      /Could not resolve dependency provider-one/,
    );
  });

  it('should handle recursive dependencies', () => {
    // Arrange
    const rootEntry = buildTestGeneratorEntry(
      { id: 'root' },
      {
        exports: {
          exportOne: providerOne.export(),
        },
      },
    );

    const middleEntry = buildTestGeneratorEntry(
      { id: 'middle' },
      {
        dependencies: { dep: providerOne.dependency().parentScopeOnly() },
        exports: {
          exportOne: providerOne.export(),
        },
      },
    );

    const leafEntry = buildTestGeneratorEntry(
      { id: 'leaf' },
      {
        dependencies: { dep: providerOne.dependency() },
      },
    );

    middleEntry.children.push(leafEntry);
    rootEntry.children.push(middleEntry);

    // Act
    const dependencyMap = resolveTaskDependencies(rootEntry);

    // Assert
    expect(dependencyMap).toEqual({
      'root#main': {},
      'middle#main': {
        dep: createDependencyEntry({
          id: 'root#main',
          providerName: providerOne.name,
        }),
      },
      'leaf#main': {
        dep: createDependencyEntry({
          id: 'middle#main',
          providerName: providerOne.name,
        }),
      },
    });
  });

  it('should handle nested scope inheritance', () => {
    // Arrange
    const rootEntry = buildTestGeneratorEntry(
      {
        id: 'root',
        scopes: [middleScope],
      },
      {
        exports: {
          rootProvider: providerOne.export(middleScope),
        },
      },
    );

    const middleEntry = buildTestGeneratorEntry(
      {
        id: 'middle',
        scopes: [middleScope],
      },
      {
        exports: {
          middleProvider: providerOne.export(middleScope),
        },
      },
    );

    const leafEntry = buildTestGeneratorEntry(
      {
        id: 'leaf',
      },
      {
        dependencies: { dep: providerOne.dependency() },
      },
    );

    middleEntry.children.push(leafEntry);
    rootEntry.children.push(middleEntry);

    // Act
    const dependencyMap = resolveTaskDependencies(rootEntry);

    // Assert
    expect(dependencyMap).toEqual({
      'root#main': {},
      'middle#main': {},
      'leaf#main': {
        dep: createDependencyEntry({
          id: 'middle#main',
          providerName: providerOne.name,
        }),
      },
    });
  });

  it('should handle output-only providers correctly', () => {
    // Arrange
    const entry = buildTestGeneratorEntry(
      {
        id: 'root',
        scopes: [defaultScope],
      },
      {
        outputs: {
          outputProvider: readOnlyProvider.export(defaultScope),
        },
      },
    );

    const childEntry = buildTestGeneratorEntry(
      {
        id: 'child',
        scopes: [defaultScope],
      },
      {
        dependencies: { dep: readOnlyProvider.dependency() },
      },
    );

    entry.children.push(childEntry);

    // Act
    const dependencyMap = resolveTaskDependencies(entry);

    // Assert
    expect(dependencyMap).toEqual({
      'root#main': {},
      'child#main': {
        dep: createOutputDependencyEntry({
          id: 'root#main',
          providerName: readOnlyProvider.name,
        }),
      },
    });
  });

  it('should resolve dependencies between tasks in the same generator entry', () => {
    // Arrange
    const entry = buildTestGeneratorEntry({
      id: 'root',
      tasks: [
        buildTestGeneratorTaskEntry({
          id: 'root#producer',
          task: {
            outputs: {
              outputProvider: readOnlyProvider.export(),
            },
          },
        }),
        buildTestGeneratorTaskEntry({
          id: 'root#consumer',
          task: {
            dependencies: { dep: readOnlyProvider.dependency() },
            exports: {},
            outputs: {},
          },
        }),
      ],
    });
    // Act
    const dependencyMap = resolveTaskDependencies(entry);

    // Assert
    expect(dependencyMap).toEqual({
      'root#producer': {},
      'root#consumer': {
        dep: createOutputDependencyEntry({
          id: 'root#producer',
          providerName: readOnlyProvider.name,
        }),
      },
    });
  });

  it('should throw error when a mutable provider is used in task outputs', () => {
    // Arrange
    const entry = buildTestGeneratorEntry(
      {
        id: 'root',
        scopes: [defaultScope],
      },
      {
        outputs: {
          // Using a regular provider in outputs should throw
          invalidOutput: providerOne.export(defaultScope),
        },
      },
    );

    // Act & Assert
    expect(() => resolveTaskDependencies(entry)).toThrow(
      /All providers in task outputs must be read-only providers/,
    );
  });

  it('should handle phase-specific dependencies correctly', () => {
    // Arrange
    const entry = buildTestGeneratorEntry({
      id: 'root',
      tasks: [
        buildTestGeneratorTaskEntry({
          id: 'root#phase1',
          task: {
            phase: phase1,
            outputs: {
              outputProvider: readOnlyProvider.export(),
            },
          },
        }),
        buildTestGeneratorTaskEntry({
          id: 'root#phase2',
          task: {
            phase: phase2,
            dependencies: { dep: readOnlyProvider.dependency() },
          },
        }),
      ],
    });

    // Act
    const phase1DependencyMap = resolveTaskDependencies(entry, phase1);
    const phase2DependencyMap = resolveTaskDependencies(entry, phase2);

    // Assert
    expect(phase1DependencyMap).toEqual({
      'root#phase1': {},
    });

    expect(phase2DependencyMap).toEqual({
      'root#phase2': {
        dep: createOutputDependencyEntry({
          id: 'root#phase1',
          providerName: readOnlyProvider.name,
        }),
      },
    });
  });

  it('should handle phase-specific scopes correctly', () => {
    // Arrange
    const entry = buildTestGeneratorEntry({
      id: 'root',
      scopes: [scope1, scope2],
      tasks: [
        buildTestGeneratorTaskEntry({
          id: 'root#phase1',
          task: {
            phase: phase1,
            exports: {
              provider1: providerOne.export(scope1),
              provider2: providerTwo.export(scope2),
            },
          },
        }),
        buildTestGeneratorTaskEntry({
          id: 'root#phase2',
          task: {
            phase: phase2,
            dependencies: {
              dep1: providerOne.dependency(),
              dep2: providerTwo.dependency(),
            },
          },
        }),
      ],
    });

    // Act
    const phase1DependencyMap = resolveTaskDependencies(entry, phase1);
    const phase2DependencyMap = resolveTaskDependencies(entry, phase2);

    // Assert
    expect(phase1DependencyMap).toEqual({
      'root#phase1': {},
    });

    expect(phase2DependencyMap).toEqual({
      'root#phase2': {
        dep1: createDependencyEntry({
          id: 'root#phase1',
          providerName: providerOne.name,
        }),
        dep2: createDependencyEntry({
          id: 'root#phase1',
          providerName: providerTwo.name,
        }),
      },
    });
  });

  it('should handle nested phase dependencies correctly', () => {
    // Arrange
    const rootEntry = buildTestGeneratorEntry({
      id: 'root',
      tasks: [
        buildTestGeneratorTaskEntry({
          id: 'root#phase1',
          task: {
            phase: phase1,
            outputs: {
              outputProvider: readOnlyProvider.export(),
            },
          },
        }),
      ],
    });

    const middleEntry = buildTestGeneratorEntry({
      id: 'middle',
      tasks: [
        buildTestGeneratorTaskEntry({
          id: 'middle#phase1',
          task: {
            phase: phase1,
            dependencies: {
              dep: readOnlyProvider.dependency().parentScopeOnly(),
            },
            outputs: {
              outputProvider: readOnlyProvider.export(),
            },
          },
        }),
      ],
    });

    const leafEntry = buildTestGeneratorEntry({
      id: 'leaf',
      tasks: [
        buildTestGeneratorTaskEntry({
          id: 'leaf#phase2',
          task: {
            phase: phase2,
            dependencies: { dep: readOnlyProvider.dependency() },
          },
        }),
      ],
    });

    middleEntry.children.push(leafEntry);
    rootEntry.children.push(middleEntry);

    // Act
    const phase1DependencyMap = resolveTaskDependencies(rootEntry, phase1);
    const phase2DependencyMap = resolveTaskDependencies(rootEntry, phase2);

    // Assert
    expect(phase1DependencyMap).toEqual({
      'root#phase1': {},
      'middle#phase1': {
        dep: createOutputDependencyEntry({
          id: 'root#phase1',
          providerName: readOnlyProvider.name,
        }),
      },
    });

    expect(phase2DependencyMap).toEqual({
      'leaf#phase2': {
        dep: createOutputDependencyEntry({
          id: 'middle#phase1',
          providerName: readOnlyProvider.name,
        }),
      },
    });
  });

  it('handles dynamic tasks in dependency resolution', () => {
    // Arrange
    const entry = buildTestGeneratorEntry({
      id: 'root',
      tasks: [
        buildTestGeneratorTaskEntry({
          id: 'root#main',
          name: 'main',
          task: {
            outputs: {
              outputProvider: readOnlyProvider.export(),
            },
          },
        }),
      ],
    });

    const dynamicTaskMap = new Map<string, GeneratorTaskEntry[]>();
    dynamicTaskMap.set('root', [
      buildTestGeneratorTaskEntry({
        id: 'root#dynamic-task',
        name: 'dynamic-task',
        task: {
          phase: phase1,
          dependencies: { dep: readOnlyProvider },
        },
      }),
    ]);

    // Act
    const phase1DependencyMap = resolveTaskDependencies(
      entry,
      phase1,
      dynamicTaskMap,
    );

    // Assert
    expect(phase1DependencyMap).toEqual({
      'root#dynamic-task': {
        dep: createOutputDependencyEntry({
          id: 'root#main',
          providerName: readOnlyProvider.name,
        }),
      },
    });
  });

  it('handles dynamic tasks with multiple phases correctly', () => {
    // Arrange
    const entry = buildTestGeneratorEntry({
      id: 'root',
      tasks: [
        buildTestGeneratorTaskEntry({
          id: 'root#main',
          name: 'main',
          task: {
            outputs: {
              outputProvider: readOnlyProvider.export(),
            },
          },
        }),
      ],
    });

    const dynamicTaskMap = new Map<string, GeneratorTaskEntry[]>();
    dynamicTaskMap.set('root', [
      buildTestGeneratorTaskEntry({
        id: 'root#dynamic-task1',
        name: 'dynamic-task1',
        task: {
          phase: phase1,
          dependencies: { dep: readOnlyProvider },
        },
      }),
      buildTestGeneratorTaskEntry({
        id: 'root#dynamic-task2',
        name: 'dynamic-task2',
        task: {
          phase: phase2,
          dependencies: { dep: readOnlyProvider },
        },
      }),
    ]);

    // Act
    const phase1DependencyMap = resolveTaskDependencies(
      entry,
      phase1,
      dynamicTaskMap,
    );
    const phase2DependencyMap = resolveTaskDependencies(
      entry,
      phase2,
      dynamicTaskMap,
    );

    // Assert
    expect(phase1DependencyMap).toEqual({
      'root#dynamic-task1': {
        dep: createOutputDependencyEntry({
          id: 'root#main',
          providerName: readOnlyProvider.name,
        }),
      },
    });

    expect(phase2DependencyMap).toEqual({
      'root#dynamic-task2': {
        dep: createOutputDependencyEntry({
          id: 'root#main',
          providerName: readOnlyProvider.name,
        }),
      },
    });
  });

  it('handles dynamic tasks with parent scope dependencies correctly', () => {
    // Arrange
    const rootEntry = buildTestGeneratorEntry({
      id: 'root',
      tasks: [
        buildTestGeneratorTaskEntry({
          id: 'root#main',
          name: 'main',
          task: {
            outputs: {
              outputProvider: readOnlyProvider.export(),
            },
          },
        }),
      ],
    });

    const childEntry = buildTestGeneratorEntry({
      id: 'child',
      tasks: [],
    });

    rootEntry.children.push(childEntry);

    const dynamicTaskMap = new Map<string, GeneratorTaskEntry[]>();
    dynamicTaskMap.set('child', [
      buildTestGeneratorTaskEntry({
        id: 'child#dynamic-task',
        name: 'dynamic-task',
        task: {
          phase: phase1,
          dependencies: {
            dep: readOnlyProvider.dependency().parentScopeOnly(),
          },
        },
      }),
    ]);

    // Act
    const phase1DependencyMap = resolveTaskDependencies(
      rootEntry,
      phase1,
      dynamicTaskMap,
    );

    // Assert
    expect(phase1DependencyMap).toEqual({
      'child#dynamic-task': {
        dep: createOutputDependencyEntry({
          id: 'root#main',
          providerName: readOnlyProvider.name,
        }),
      },
    });
  });
});
