import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createProviderExportScope,
  createProviderType,
} from '@src/providers/index.js';
import { buildTestGeneratorBundle } from '@src/runner/tests/factories.test-helper.js';
import { createEventedLogger } from '@src/utils/evented-logger.js';

import type { ProviderExportMap } from './generators.js';

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
      tasks: [
        {
          name: 'test-task',
          dependencies: {
            test: testProviderType,
          },
          exports: {
            test: testProviderType.export(),
          },
          run: () => ({
            providers: { test: {} },
            build: () => ({}),
          }),
        },
      ],
    });

    const entry = await buildGeneratorEntry(bundle, { logger });

    expect(entry).toMatchObject({
      id: 'root',
      generatorBaseDirectory: '/test',
      scopes: [],
      children: [],
      tasks: [
        {
          id: 'root#test-task',
          dependencies: { test: testProviderType },
          exports: { test: expect.any(Object) as ProviderExportMap },
          generatorBaseDirectory: '/test',
          generatorName: 'test-package#test-generator',
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
      tasks: [
        {
          name: 'child-task',
          run: () => ({
            providers: {},
            build: () => ({}),
          }),
        },
      ],
    };

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
      tasks: [],
    };

    const entry = await buildGeneratorEntry(bundle, { logger });

    expect(entry).toMatchObject({
      id: 'root',
      generatorBaseDirectory: '/test/parent',
      children: [
        {
          id: 'root.child',
          generatorBaseDirectory: '/test/child',
          tasks: [
            {
              id: 'root.child#child-task',
              generatorName: 'child-package#child-generator',
            },
          ],
        },
        {
          id: 'root.multiChild.child-1',
          generatorBaseDirectory: '/test/child',
          tasks: [
            {
              id: 'root.multiChild.child-1#child-task',
              generatorName: 'child-package#child-generator',
            },
          ],
        },
        {
          id: 'root.multiChild.child-2',
          generatorBaseDirectory: '/test/child',
          tasks: [
            {
              id: 'root.multiChild.child-2#child-task',
              generatorName: 'child-package#child-generator',
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
      tasks: [],
    };

    const entry = await buildGeneratorEntry(bundle, { logger });

    expect(entry.scopes).toEqual([scope]);
  });
});
