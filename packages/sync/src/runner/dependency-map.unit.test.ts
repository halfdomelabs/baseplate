import { describe, expect, it } from 'vitest';

import type {
  GeneratorEntry,
  GeneratorTaskEntry,
} from '@src/generators/build-generator-entry.js';
import type { TaskPhase } from '@src/phases/types.js';
import type { Logger } from '@src/utils/index.js';

import { createEventedLogger } from '@src/utils/index.js';

import type { EntryDependencyMap } from './dependency-map.js';

import {
  createProviderExportScope,
  createProviderType,
} from '../providers/index.js';
import {
  buildGeneratorIdToScopesMap,
  resolveTaskDependenciesForPhase,
} from './dependency-map.js';
import {
  buildTestGeneratorEntry,
  buildTestGeneratorTaskEntry,
} from './tests/factories.test-helper.js';

const providerOne = createProviderType('provider-one');
const providerTwo = createProviderType('provider-two');
const readOnlyProvider = createProviderType('read-only-provider', {
  isReadOnly: true,
});
const outputOnlyProvider = createProviderType('output-only-provider', {
  isOutput: true,
});
const testLogger = createEventedLogger({ noConsole: true });

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
  logger: Logger,
  phase?: TaskPhase,
  dynamicTaskEntries?: Map<string, GeneratorTaskEntry[]>,
): EntryDependencyMap {
  const generatorIdToScopesMap = buildGeneratorIdToScopesMap(entry);
  return resolveTaskDependenciesForPhase(
    entry,
    generatorIdToScopesMap,
    phase,
    dynamicTaskEntries,
    logger,
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
    const dependencyMap = resolveTaskDependencies(entry, testLogger);

    // Assert
    expect(dependencyMap).toEqual({
      'root#main': {},
      'child#main': {
        dep: {
          id: 'root#main',
          providerName: readOnlyProvider.name,
          options: { isReadOnly: true },
        },
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
    const dependencyMap = resolveTaskDependencies(entry, testLogger);

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
    const dependencyMap = resolveTaskDependencies(entry, testLogger);

    // Assert
    expect(dependencyMap).toEqual({
      'root#main': {},
      'child1#main': {
        dep: {
          id: 'root#main',
          providerName: providerOne.name,
          options: {},
        },
      },
      'child2#main': {
        dep: {
          id: 'root#main',
          providerName: providerTwo.name,
          options: {},
        },
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
    const dependencyMap = resolveTaskDependencies(entry, testLogger);

    // Assert
    expect(dependencyMap).toEqual({
      'root#main': {},
      'child1#main': {
        dep: {
          id: 'root#main',
          providerName: providerOne.name,
          options: {},
        },
      },
      'child2#main': {
        dep: {
          id: 'root#main',
          providerName: providerOne.name,
          options: {},
        },
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
    const dependencyMap = resolveTaskDependencies(rootEntry, testLogger);

    // Assert
    expect(dependencyMap).toEqual({
      'root#main': {},
      'middle#main': {},
      'leaf#main': {
        dep1: {
          id: 'middle#main',
          providerName: providerOne.name,
          options: {},
        },
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
    const dependencyMap = resolveTaskDependencies(entry, testLogger);

    // Assert
    expect(dependencyMap).toEqual({
      'root#main': {},
      'child#main': {
        dep: {
          id: 'peer#main',
          providerName: providerOne.name,
          options: {},
        },
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
    expect(() => resolveTaskDependencies(entry, testLogger)).toThrow(
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
    expect(() => resolveTaskDependencies(entry, testLogger)).toThrow(
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
    const dependencyMap = resolveTaskDependencies(rootEntry, testLogger);

    // Assert
    expect(dependencyMap).toEqual({
      'root#main': {},
      'middle#main': {
        dep: { id: 'root#main', providerName: providerOne.name, options: {} },
      },
      'leaf#main': {
        dep: { id: 'middle#main', providerName: providerOne.name, options: {} },
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
    const dependencyMap = resolveTaskDependencies(rootEntry, testLogger);

    // Assert
    expect(dependencyMap).toEqual({
      'root#main': {},
      'middle#main': {},
      'leaf#main': {
        dep: {
          id: 'middle#main',
          providerName: providerOne.name,
          options: {},
        },
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
          outputProvider: outputOnlyProvider.export(defaultScope),
        },
      },
    );

    const childEntry = buildTestGeneratorEntry(
      {
        id: 'child',
        scopes: [defaultScope],
      },
      {
        dependencies: { dep: outputOnlyProvider.dependency() },
      },
    );

    entry.children.push(childEntry);

    // Act
    const dependencyMap = resolveTaskDependencies(entry, testLogger);

    // Assert
    expect(dependencyMap).toEqual({
      'root#main': {},
      'child#main': {
        dep: {
          id: 'root#main',
          providerName: outputOnlyProvider.name,
          options: { isOutput: true },
        },
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
              outputProvider: outputOnlyProvider.export(),
            },
          },
        }),
        buildTestGeneratorTaskEntry({
          id: 'root#consumer',
          task: {
            dependencies: { dep: outputOnlyProvider.dependency() },
            exports: {},
            outputs: {},
          },
        }),
      ],
    });
    // Act
    const dependencyMap = resolveTaskDependencies(entry, testLogger);

    // Assert
    expect(dependencyMap).toEqual({
      'root#producer': {},
      'root#consumer': {
        dep: {
          id: 'root#producer',
          providerName: outputOnlyProvider.name,
          options: { isOutput: true },
        },
      },
    });
  });

  it('should throw error when non-output provider is used in task outputs', () => {
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
    expect(() => resolveTaskDependencies(entry, testLogger)).toThrow(
      /All providers in task outputs must be output providers/,
    );
  });

  it('should throw error when non-output provider is used in task exports', () => {
    // Arrange
    const entry = buildTestGeneratorEntry(
      {
        id: 'root',
        scopes: [defaultScope],
      },
      {
        exports: {
          invalidExport: outputOnlyProvider.export(defaultScope),
        },
      },
    );

    // Act & Assert
    expect(() => resolveTaskDependencies(entry, testLogger)).toThrow(
      /All providers in task exports must be non-output providers/,
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
              outputProvider: outputOnlyProvider.export(),
            },
          },
        }),
        buildTestGeneratorTaskEntry({
          id: 'root#phase2',
          task: {
            phase: phase2,
            dependencies: { dep: outputOnlyProvider.dependency() },
          },
        }),
      ],
    });

    // Act
    const phase1DependencyMap = resolveTaskDependencies(
      entry,
      testLogger,
      phase1,
    );
    const phase2DependencyMap = resolveTaskDependencies(
      entry,
      testLogger,
      phase2,
    );

    // Assert
    expect(phase1DependencyMap).toEqual({
      'root#phase1': {},
    });

    expect(phase2DependencyMap).toEqual({
      'root#phase2': {
        dep: {
          id: 'root#phase1',
          providerName: outputOnlyProvider.name,
          options: { isOutput: true },
        },
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
    const phase1DependencyMap = resolveTaskDependencies(
      entry,
      testLogger,
      phase1,
    );
    const phase2DependencyMap = resolveTaskDependencies(
      entry,
      testLogger,
      phase2,
    );

    // Assert
    expect(phase1DependencyMap).toEqual({
      'root#phase1': {},
    });

    expect(phase2DependencyMap).toEqual({
      'root#phase2': {
        dep1: {
          id: 'root#phase1',
          providerName: providerOne.name,
          options: {},
        },
        dep2: {
          id: 'root#phase1',
          providerName: providerTwo.name,
          options: {},
        },
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
              outputProvider: outputOnlyProvider.export(),
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
              dep: outputOnlyProvider.dependency().parentScopeOnly(),
            },
            outputs: {
              outputProvider: outputOnlyProvider.export(),
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
            dependencies: { dep: outputOnlyProvider.dependency() },
          },
        }),
      ],
    });

    middleEntry.children.push(leafEntry);
    rootEntry.children.push(middleEntry);

    // Act
    const phase1DependencyMap = resolveTaskDependencies(
      rootEntry,
      testLogger,
      phase1,
    );
    const phase2DependencyMap = resolveTaskDependencies(
      rootEntry,
      testLogger,
      phase2,
    );

    // Assert
    expect(phase1DependencyMap).toEqual({
      'root#phase1': {},
      'middle#phase1': {
        dep: {
          id: 'root#phase1',
          providerName: outputOnlyProvider.name,
          options: { isOutput: true },
        },
      },
    });

    expect(phase2DependencyMap).toEqual({
      'leaf#phase2': {
        dep: {
          id: 'middle#phase1',
          providerName: outputOnlyProvider.name,
          options: { isOutput: true },
        },
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
          task: {
            name: 'main',
            outputs: {
              outputProvider: outputOnlyProvider.export(),
            },
          },
        }),
      ],
    });

    const dynamicTaskMap = new Map<string, GeneratorTaskEntry[]>();
    dynamicTaskMap.set('root', [
      buildTestGeneratorTaskEntry({
        id: 'root#dynamic-task',
        task: {
          name: 'dynamic-task',
          phase: phase1,
          dependencies: { dep: outputOnlyProvider },
        },
      }),
    ]);

    // Act
    const phase1DependencyMap = resolveTaskDependencies(
      entry,
      testLogger,
      phase1,
      dynamicTaskMap,
    );

    // Assert
    expect(phase1DependencyMap).toEqual({
      'root#dynamic-task': {
        dep: {
          id: 'root#main',
          providerName: outputOnlyProvider.name,
          options: { isOutput: true },
        },
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
          task: {
            name: 'main',
            outputs: {
              outputProvider: outputOnlyProvider.export(),
            },
          },
        }),
      ],
    });

    const dynamicTaskMap = new Map<string, GeneratorTaskEntry[]>();
    dynamicTaskMap.set('root', [
      buildTestGeneratorTaskEntry({
        id: 'root#dynamic-task1',
        task: {
          name: 'dynamic-task1',
          phase: phase1,
          dependencies: { dep: outputOnlyProvider },
        },
      }),
      buildTestGeneratorTaskEntry({
        id: 'root#dynamic-task2',
        task: {
          name: 'dynamic-task2',
          phase: phase2,
          dependencies: { dep: outputOnlyProvider },
        },
      }),
    ]);

    // Act
    const phase1DependencyMap = resolveTaskDependencies(
      entry,
      testLogger,
      phase1,
      dynamicTaskMap,
    );
    const phase2DependencyMap = resolveTaskDependencies(
      entry,
      testLogger,
      phase2,
      dynamicTaskMap,
    );

    // Assert
    expect(phase1DependencyMap).toEqual({
      'root#dynamic-task1': {
        dep: {
          id: 'root#main',
          providerName: outputOnlyProvider.name,
          options: { isOutput: true },
        },
      },
    });

    expect(phase2DependencyMap).toEqual({
      'root#dynamic-task2': {
        dep: {
          id: 'root#main',
          providerName: outputOnlyProvider.name,
          options: { isOutput: true },
        },
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
          task: {
            name: 'main',
            outputs: {
              outputProvider: outputOnlyProvider.export(),
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
        task: {
          name: 'dynamic-task',
          phase: phase1,
          dependencies: {
            dep: outputOnlyProvider.dependency().parentScopeOnly(),
          },
        },
      }),
    ]);

    // Act
    const phase1DependencyMap = resolveTaskDependencies(
      rootEntry,
      testLogger,
      phase1,
      dynamicTaskMap,
    );

    // Assert
    expect(phase1DependencyMap).toEqual({
      'child#dynamic-task': {
        dep: {
          id: 'root#main',
          providerName: outputOnlyProvider.name,
          options: { isOutput: true },
        },
      },
    });
  });
});
