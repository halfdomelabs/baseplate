import { GeneratorEntry } from '../generator-builder';

let lastGeneratorId = 100;

export function buildTestGeneratorEntry(
  data?: Partial<GeneratorEntry>
): GeneratorEntry {
  lastGeneratorId += 1;
  return {
    id: lastGeneratorId.toString(),
    descriptor: { generator: 'simple' },
    exports: {},
    dependencies: {},
    generatorConfig: {
      configBaseDirectory: '/',
      createGenerator: jest.fn(),
      parseDescriptor: jest.fn(),
    },
    children: [],
    ...data,
  };
}
