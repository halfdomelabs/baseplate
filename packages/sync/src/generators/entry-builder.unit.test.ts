import { describe, expect, it, vi } from 'vitest';

import { buildTestGeneratorBundle } from '@src/runner/tests/factories.test-helper.js';
import { readJsonWithSchema } from '@src/utils/fs.js';
import { createEventedLogger } from '@src/utils/index.js';

import type { ProviderDependencyMap, ProviderExportMap } from './generators.js';
import type { GeneratorConfigMap } from './loader.js';

import { createProviderType } from '../providers/index.js';
import {
  buildGeneratorEntryFromDescriptor,
  getGeneratorId,
} from './entry-builder.js';

vi.mock('../utils/fs.js');

const mockedReadJsonWithSchema = vi.mocked(readJsonWithSchema);

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
      true,
    );
    expect(id).toBe('project:bar.child');
  });

  it('throws if there is no name on a multiple child', () => {
    expect(() => getGeneratorId(DESCRIPTOR, 'foo', 'bar', true)).toThrow(
      'must have a name',
    );
  });
});

describe('buildGeneratorEntryFromDescriptor', () => {
  const simpleDependencies: ProviderDependencyMap = {
    dep: createProviderType('dep'),
  };
  const simpleExports: ProviderExportMap = {
    exp: createProviderType('exp').export(),
  };
  const generatorMap: GeneratorConfigMap = {
    simple: {
      config: {
        createGenerator: () =>
          buildTestGeneratorBundle({
            tasks: [
              {
                name: 'main',
                dependencies: simpleDependencies,
                exports: simpleExports,
                taskDependencies: [],
                run: vi.fn(),
              },
            ],
          }),
      },
      directory: '/simple',
    },
    nested: {
      config: {
        createGenerator: () =>
          buildTestGeneratorBundle({
            children: {
              child: { generator: 'simple' },
              childMany: [{ name: 'bob', generator: 'simple' }],
            },
          }),
      },
      directory: '/simple',
    },
    reference: {
      config: {
        createGenerator: () =>
          buildTestGeneratorBundle({
            children: {
              child: 'child-descriptor',
            },
          }),
      },
      directory: '/simple',
    },
    duplicateReference: {
      config: {
        createGenerator: () =>
          buildTestGeneratorBundle({
            children: {
              child: { generator: 'simple' },
              childDuplicate: { generator: 'simple' },
            },
          }),
      },
      directory: '/simple',
    },
    validatedDescriptor: {
      config: {
        createGenerator: () =>
          buildTestGeneratorBundle({
            children: {
              child: { generator: 'simple' },
              childDuplicate: { generator: 'simple' },
            },
          }),
      },
      directory: '/simple',
    },
  };

  const generatorContext = {
    baseDirectory: '/root',
    generatorMap,
    logger: createEventedLogger({ noConsole: true }),
  };

  it('should build a simple unnested generator', async () => {
    const entry = await buildGeneratorEntryFromDescriptor(
      { generator: 'simple' },
      'project',
      generatorContext,
    );
    expect(entry).toMatchObject({
      id: 'project',
      generatorConfig: generatorMap.simple?.config,
      children: [],
      tasks: [
        {
          id: 'project#main',
          dependencies: simpleDependencies,
          exports: simpleExports,
        },
      ],
    });
  });

  it('should build a nested generator', async () => {
    const entry = await buildGeneratorEntryFromDescriptor(
      { generator: 'nested' },
      'project',
      generatorContext,
    );
    expect(entry).toMatchObject({
      generatorConfig: generatorMap.nested?.config,
    });
    expect(entry.children).toMatchObject([
      {
        id: 'project:child',
        generatorConfig: generatorMap.simple?.config,
      },
      {
        id: 'project:childMany.bob',
        generatorConfig: generatorMap.simple?.config,
      },
    ]);
  });

  it('should build a reference child', async () => {
    mockedReadJsonWithSchema.mockResolvedValueOnce({ generator: 'simple' });

    const entry = await buildGeneratorEntryFromDescriptor(
      { generator: 'reference' },
      'project',
      generatorContext,
    );
    expect(entry).toMatchObject({
      generatorConfig: generatorMap.reference?.config,
    });
    expect(entry.children).toMatchObject([
      {
        id: 'child-descriptor',
        generatorConfig: generatorMap.simple?.config,
      },
    ]);
    expect(mockedReadJsonWithSchema).toHaveBeenCalledWith(
      '/root/child-descriptor.json',
      expect.anything() as unknown,
    );
  });
});
