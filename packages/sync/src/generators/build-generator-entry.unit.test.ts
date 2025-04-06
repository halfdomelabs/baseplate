import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createProviderExportScope,
  createProviderType,
} from '@src/providers/index.js';
import { buildTestGeneratorBundle } from '@src/runner/tests/factories.test-helper.js';
import { createEventedLogger } from '@src/utils/evented-logger.js';

import type { GeneratorBundle, ProviderExportMap } from './generators.js';

import { buildGeneratorEntry } from './build-generator-entry.js';

// Mock the fs module
vi.mock('node:fs');
vi.mock('node:fs/promises');

describe('buildGeneratorEntry', () => {
  const testProviderType = createProviderType('test');
  const logger = createEventedLogger({ noConsole: true });

  beforeEach(() => {
    vol.reset();
    vi.clearAllMocks();
  });

  it('builds a simple generator entry', async () => {
    // Set up test package.json
    const testFs = {
      '/test/package.json': JSON.stringify({
        name: 'test-package',
      }),
    };
    vol.fromJSON(testFs, '/');

    const bundle = buildTestGeneratorBundle({
      name: 'test-generator',
      directory: '/test',
      tasks: {
        'test-task': {
          dependencies: {
            test: testProviderType,
          },
          exports: {
            test: testProviderType.export(),
          },
          run: () => ({
            providers: { test: {} },
            build: () => {
              /* no-op */
            },
          }),
        },
      },
    });

    const entry = await buildGeneratorEntry(bundle, { logger });

    expect(entry).toMatchObject({
      id: 'root',
      scopes: [],
      children: [],
      generatorInfo: {
        name: 'test-package#test-generator',
        baseDirectory: '/test',
      },
      tasks: [
        {
          id: 'root#test-task',
          task: {
            dependencies: { test: testProviderType },
            exports: { test: expect.any(Object) as ProviderExportMap },
          },
          generatorInfo: {
            name: 'test-package#test-generator',
            baseDirectory: '/test',
          },
        },
      ],
    });
  });

  it('builds nested generator entries', async () => {
    // Set up test package.json files
    const testFs = {
      '/test/parent/package.json': JSON.stringify({
        name: 'parent-package',
      }),
      '/test/child/package.json': JSON.stringify({
        name: 'child-package',
      }),
    };
    vol.fromJSON(testFs, '/');

    const childBundle = {
      name: 'child-generator',
      directory: '/test/child',
      scopes: [],
      children: {},
      tasks: {
        'child-task': {
          run: () => ({
            providers: {},
            build: () => {
              /* no-op */
            },
          }),
        },
      },
    } satisfies GeneratorBundle;

    const bundle = {
      name: 'parent-generator',
      directory: '/test/parent',
      scopes: [],
      children: {
        child: childBundle,
        multiChild: [
          { ...childBundle, instanceName: 'child-1' },
          { ...childBundle, instanceName: 'child-2' },
        ],
      },
      tasks: {},
    } satisfies GeneratorBundle;

    const entry = await buildGeneratorEntry(bundle, { logger });

    expect(entry).toMatchObject({
      id: 'root',
      generatorInfo: {
        name: 'parent-package#parent-generator',
        baseDirectory: '/test/parent',
      },
      children: [
        {
          id: 'root.child',
          generatorInfo: {
            name: 'child-package#child-generator',
            baseDirectory: '/test/child',
          },
          tasks: [
            {
              id: 'root.child#child-task',
              generatorInfo: {
                name: 'child-package#child-generator',
                baseDirectory: '/test/child',
              },
            },
          ],
        },
        {
          id: 'root.multiChild.child-1',
          tasks: [
            {
              id: 'root.multiChild.child-1#child-task',
              generatorInfo: {
                name: 'child-package#child-generator',
                baseDirectory: '/test/child',
              },
            },
          ],
        },
        {
          id: 'root.multiChild.child-2',
          tasks: [
            {
              id: 'root.multiChild.child-2#child-task',
              generatorInfo: {
                name: 'child-package#child-generator',
                baseDirectory: '/test/child',
              },
            },
          ],
        },
      ],
    });
  });

  it('preserves scopes from bundle', async () => {
    // Set up test package.json
    const testFs = {
      '/test/package.json': JSON.stringify({
        name: 'test-package',
      }),
    };
    vol.fromJSON(testFs, '/');

    const scope = createProviderExportScope('test-scope', 'desc');
    const bundle = {
      name: 'test-generator',
      directory: '/test',
      scopes: [scope],
      children: {},
      tasks: {},
    } satisfies GeneratorBundle;

    const entry = await buildGeneratorEntry(bundle, { logger });

    expect(entry.scopes).toEqual([scope]);
  });
});
