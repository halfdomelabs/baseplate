import { GeneratorEntry, GeneratorTaskEntry } from '../generator-builder';

let lastGeneratorId = 100;
let lastTaskId = 100;

export function buildTestGeneratorTaskEntry(
  data?: Partial<GeneratorTaskEntry>
): GeneratorTaskEntry {
  lastTaskId += 1;
  return {
    id: lastTaskId.toString(),
    dependencies: {},
    exports: {},
    dependentTaskIds: [],
    task: {
      name: `task-${lastTaskId}`,
      exports: {},
      dependencies: {},
      taskDependencies: [],
      run: jest.fn(),
    },
    generatorBaseDirectory: '/',
    generatorName: 'test-generator',
    ...data,
  };
}

export function buildTestGeneratorEntry(
  data?: Partial<GeneratorEntry>,
  task?: Partial<GeneratorTaskEntry>
): GeneratorEntry {
  lastGeneratorId += 1;
  const id = data?.id || lastGeneratorId.toString();
  const tasks =
    data?.tasks ||
    (!task
      ? []
      : [
          buildTestGeneratorTaskEntry({
            id: `${id}#main`,
            generatorName: 'simple',
            ...task,
          }),
        ]);
  return {
    id,
    descriptor: { generator: 'simple' },
    generatorConfig: {
      configBaseDirectory: '/',
      createGenerator: () => tasks.map((t) => t.task),
      parseDescriptor: jest.fn(),
    },
    children: [],
    tasks,
    ...data,
  };
}
