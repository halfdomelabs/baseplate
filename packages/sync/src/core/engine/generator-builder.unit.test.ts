import { ProviderDependencyMap, ProviderExportMap } from '../generator';
import { GeneratorConfigMap } from '../loader';
import { createProviderType } from '../provider';
import { loadDescriptorFromFile } from './descriptor-loader';
import { buildGeneratorEntry, getGeneratorId } from './generator-builder';

jest.mock('./descriptor-loader');

const mockedLoad = jest.mocked(loadDescriptorFromFile);

describe('getGeneratorId', () => {
  const DESCRIPTOR = { generator: 'foobar' };

  it('gets the ID of a reference correctly', () => {
    const id = getGeneratorId('modules/foobar', 'project:foo', 'bar', false);
    expect(id).toBe('modules/foobar');
  });

  it('gets the ID of a single child correctly', () => {
    const id = getGeneratorId(DESCRIPTOR, 'project', 'bar', false);
    expect(id).toBe('project:bar');
  });

  it('gets the ID of a single child with nested parent correctly', () => {
    const id = getGeneratorId(DESCRIPTOR, 'project:features', 'bar', false);
    expect(id).toBe('project:features.bar');
  });

  it('gets the ID of a multiple child correctly', () => {
    const id = getGeneratorId(
      { ...DESCRIPTOR, name: 'child' },
      'project',
      'bar',
      true
    );
    expect(id).toBe('project:bar.child');
  });

  it('throws if there is no name on a multiple child', () => {
    expect(() => getGeneratorId(DESCRIPTOR, 'foo', 'bar', true)).toThrow(
      'must have a name'
    );
  });
});

describe('buildGeneratorEntry', () => {
  const simpleDependencies: ProviderDependencyMap = {
    dep: createProviderType('dep'),
  };
  const simpleExports: ProviderExportMap = {
    exp: createProviderType('exp'),
  };
  const generatorMap: GeneratorConfigMap = {
    simple: {
      parseDescriptor: () => ({
        dependencies: simpleDependencies,
      }),
      exports: simpleExports,
      createGenerator: jest.fn(),
      configBaseDirectory: '/simple',
    },
    nested: {
      parseDescriptor: () => ({
        children: {
          child: { generator: 'simple' },
          childMany: [{ name: 'bob', generator: 'simple' }],
        },
      }),
      createGenerator: jest.fn(),
      configBaseDirectory: '/simple',
    },
    reference: {
      parseDescriptor: () => ({ children: { child: 'child-descriptor' } }),
      createGenerator: jest.fn(),
      configBaseDirectory: '/simple',
    },
    duplicateReference: {
      parseDescriptor: () => ({
        children: {
          child: 'child-descriptor',
          childDuplicate: 'child-descriptor',
        },
      }),
      createGenerator: jest.fn(),
      configBaseDirectory: '/simple',
    },
    validatedDescriptor: {
      parseDescriptor: () => ({
        validatedDescriptor: { name: 'hi', generator: 'foo' },
      }),
      createGenerator: jest.fn(),
      configBaseDirectory: '/simple',
    },
  };

  const generatorContext = {
    baseDirectory: '/root',
    generatorMap,
  };

  it('should build a simple unnested generator', async () => {
    const entry = await buildGeneratorEntry(
      { generator: 'simple' },
      'project',
      generatorContext
    );
    expect(entry).toMatchObject({
      id: 'project',
      generatorConfig: generatorMap.simple,
      descriptor: { generator: 'simple' },
      dependencies: simpleDependencies,
      children: [],
      exports: simpleExports,
    });
  });

  it('should build a validated descriptor', async () => {
    const entry = await buildGeneratorEntry(
      { generator: 'validatedDescriptor' },
      'project',
      generatorContext
    );
    expect(entry.descriptor).toMatchObject({
      name: 'hi',
      generator: 'foo',
    });
  });

  it('should build a nested generator', async () => {
    const entry = await buildGeneratorEntry(
      { generator: 'nested' },
      'project',
      generatorContext
    );
    expect(entry).toMatchObject({
      generatorConfig: generatorMap.nested,
      descriptor: { generator: 'nested' },
    });
    expect(entry.children).toMatchObject([
      {
        id: 'project:child',
        generatorConfig: generatorMap.simple,
        descriptor: { generator: 'simple' },
      },
      {
        id: 'project:childMany.bob',
        generatorConfig: generatorMap.simple,
        descriptor: { generator: 'simple' },
      },
    ]);
  });

  it('should build a reference child', async () => {
    mockedLoad.mockResolvedValueOnce({ generator: 'simple' });

    const entry = await buildGeneratorEntry(
      { generator: 'reference' },
      'project',
      generatorContext
    );
    expect(entry).toMatchObject({
      generatorConfig: generatorMap.reference,
      descriptor: { generator: 'reference' },
    });
    expect(entry.children).toMatchObject([
      {
        id: 'child-descriptor',
        generatorConfig: generatorMap.simple,
        descriptor: { generator: 'simple' },
      },
    ]);
    expect(mockedLoad).toHaveBeenCalledWith('/root/child-descriptor');
  });
});
