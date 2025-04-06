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
    tasks: {},
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
  lastTaskId += 1;
  const run = data?.task?.run ?? vi.fn();
  return {
    id: lastTaskId.toString(),
    name: `task-${lastTaskId.toString()}`,
    generatorId: lastGeneratorId.toString(),
    generatorInfo: {
      name: 'test-generator',
      baseDirectory: '/',
    },
    ...data,
    task: {
      run,
      ...data?.task,
    },
  };
}

export function buildTestGeneratorEntry(
  data?: Partial<GeneratorEntry>,
  task?: Pick<
    Partial<GeneratorTask>,
    'name' | 'dependencies' | 'exports' | 'outputs' | 'run' | 'phase'
  >,
): GeneratorEntry {
  lastGeneratorId += 1;
  const id = data?.id ?? lastGeneratorId.toString();
  const generatorInfo = data?.generatorInfo ?? {
    name: 'test-generator',
    baseDirectory: '/',
  };
  const tasks =
    data?.tasks ??
    (task
      ? [
          buildTestGeneratorTaskEntry({
            id: `${id}#${task.name ?? 'main'}`,
            generatorId: id,
            generatorInfo,
            task,
          }),
        ]
      : []);
  return {
    id,
    generatorInfo,
    scopes: [],
    children: [],
    tasks,
    preRegisteredPhases: [],
    ...data,
  };
}
