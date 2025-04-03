import { vi } from 'vitest';

import type {
  GeneratorBundle,
  GeneratorTask,
} from '@src/generators/generators.js';

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
  data?: Omit<Partial<GeneratorTaskEntry>, 'task'> & {
    task?: Partial<GeneratorTask>;
  },
): GeneratorTaskEntry {
  const phase = data?.task?.phase ?? data?.phase;
  lastTaskId += 1;
  const dependencies = data?.task?.dependencies ?? data?.dependencies ?? {};
  const exports = data?.task?.exports ?? data?.exports ?? {};
  const outputs = data?.task?.outputs ?? data?.outputs ?? {};
  const run = data?.task?.run ?? vi.fn();
  return {
    id: lastTaskId.toString(),
    dependencies,
    exports,
    outputs,
    generatorBaseDirectory: '/',
    generatorName: 'test-generator',
    phase,
    ...data,
    task: {
      name: `task-${lastTaskId.toString()}`,
      exports,
      dependencies,
      outputs,
      run,
      phase,
      ...data?.task,
    },
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
