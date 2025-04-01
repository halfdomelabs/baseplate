import { vi } from 'vitest';

import type { GeneratorBundle } from '@src/generators/generators.js';

import type {
  GeneratorEntry,
  GeneratorTaskEntry,
} from '../../generators/build-generator-entry.js';

let lastGeneratorId = 100;
let lastTaskId = 100;

export function buildTestGeneratorBundle(
  bundle: Partial<GeneratorBundle>,
): GeneratorBundle {
  return {
    scopes: [],
    children: {},
    tasks: [],
    name: 'test-generator',
    directory: '/',
    ...bundle,
  };
}

export function buildTestGeneratorTaskEntry(
  data?: Partial<GeneratorTaskEntry>,
): GeneratorTaskEntry {
  lastTaskId += 1;
  return {
    id: lastTaskId.toString(),
    dependencies: {},
    exports: {},
    outputs: {},
    task: {
      name: `task-${lastTaskId.toString()}`,
      exports: {},
      dependencies: {},
      outputs: {},
      run: vi.fn(),
    },
    generatorBaseDirectory: '/',
    generatorName: 'test-generator',
    ...data,
  };
}

export function buildTestGeneratorEntry(
  data?: Partial<GeneratorEntry>,
  task?: Partial<GeneratorTaskEntry>,
): GeneratorEntry {
  lastGeneratorId += 1;
  const id = data?.id ?? lastGeneratorId.toString();
  const tasks =
    data?.tasks ??
    (task
      ? [
          buildTestGeneratorTaskEntry({
            id: `${id}#main`,
            ...task,
            generatorName: task.generatorName ?? 'simple',
          }),
        ]
      : []);
  return {
    id,
    scopes: [],
    generatorBaseDirectory: '/',
    children: [],
    tasks,
    ...data,
  };
}
