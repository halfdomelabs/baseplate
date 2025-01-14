import { describe, expect, it } from 'vitest';

import {
  createProviderExportScope,
  createProviderType,
} from '@src/providers/index.js';
import { buildTestGeneratorBundle } from '@src/runner/tests/factories.test-helper.js';
import { createEventedLogger } from '@src/utils/evented-logger.js';

import type { ProviderExportMap } from './generators.js';

import { buildGeneratorEntry } from './build-generator-entry.js';

describe('buildGeneratorEntry', () => {
  const testProviderType = createProviderType('test');
  const logger = createEventedLogger({ noConsole: true });

  it('builds a simple generator entry', () => {
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
          taskDependencies: [],
          run: () => ({}),
        },
      ],
    });

    const entry = buildGeneratorEntry(bundle, { logger });

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
          dependentTaskIds: [],
          generatorBaseDirectory: '/test',
          generatorName: 'test-generator',
        },
      ],
    });
  });

  it('builds nested generator entries', () => {
    const childBundle = {
      name: 'child-generator',
      directory: '/test/child',
      scopes: [],
      children: {},
      tasks: [
        {
          name: 'child-task',
          taskDependencies: [],
          run: () => ({}),
        },
      ],
    };

    const bundle = {
      name: 'parent-generator',
      directory: '/test',
      scopes: [],
      children: {
        child: childBundle,
        multiChild: [childBundle, childBundle],
      },
      tasks: [],
    };

    const entry = buildGeneratorEntry(bundle, { logger });

    expect(entry).toMatchObject({
      id: 'root',
      generatorBaseDirectory: '/test',
      children: [
        {
          id: 'root.child',
          generatorBaseDirectory: '/test/child',
          tasks: [
            {
              id: 'root.child#child-task',
              generatorName: 'child-generator',
            },
          ],
        },
        {
          id: 'root.multiChild.0',
          generatorBaseDirectory: '/test/child',
          tasks: [
            {
              id: 'root.multiChild.0#child-task',
              generatorName: 'child-generator',
            },
          ],
        },
        {
          id: 'root.multiChild.1',
          generatorBaseDirectory: '/test/child',
          tasks: [
            {
              id: 'root.multiChild.1#child-task',
              generatorName: 'child-generator',
            },
          ],
        },
      ],
    });
  });

  it('supports task dependencies', () => {
    const bundle = {
      name: 'test-generator',
      directory: '/test',
      scopes: [],
      children: {},
      tasks: [
        {
          name: 'task1',
          taskDependencies: [],
          run: () => ({}),
        },
        {
          name: 'task2',
          taskDependencies: ['task1'],
          run: () => ({}),
        },
      ],
    };

    const entry = buildGeneratorEntry(bundle, { logger });

    expect(entry.tasks[1].dependentTaskIds).toEqual(['root#task1']);
  });

  it('preserves scopes from bundle', () => {
    const scope = createProviderExportScope('test-scope', 'desc');
    const bundle = {
      name: 'test-generator',
      directory: '/test',
      scopes: [scope],
      children: {},
      tasks: [],
    };

    const entry = buildGeneratorEntry(bundle, { logger });

    expect(entry.scopes).toEqual([scope]);
  });
});
