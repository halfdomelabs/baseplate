import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import type { GeneratorTaskOutputBuilder } from '@src/output/generator-task-output.js';

import {
  createProviderExportScope,
  createProviderType,
} from '@src/providers/index.js';

import { createGenerator } from './create-generator.js';

describe('createGenerator', () => {
  const testProviderType = createProviderType('test');
  const test2ProviderType = createProviderType('test2');

  it('creates a basic generator with no descriptor schema', () => {
    const generator = createGenerator({
      name: 'test-generator',
      generatorFileUrl: import.meta.url,
      buildTasks: (taskBuilder) => {
        taskBuilder.addTask({
          name: 'test-task',
          run: () => ({
            build: (builder: GeneratorTaskOutputBuilder) => {
              builder.writeFile({
                id: 'test',
                filePath: 'test.txt',
                contents: 'content',
              });
            },
          }),
        });
      },
    });

    const bundle = generator({});

    expect(bundle).toMatchObject({
      name: 'test-generator',
      directory: path.dirname(fileURLToPath(import.meta.url)),
      scopes: [],
      children: {},
      tasks: [
        {
          name: 'test-task',
          taskDependencies: [],
        },
      ],
    });
  });

  it('validates descriptor with schema', () => {
    const descriptorSchema = z.object({
      value: z.string(),
    });

    const generator = createGenerator({
      name: 'test-generator',
      generatorFileUrl: import.meta.url,
      descriptorSchema,
      buildTasks: () => {
        // No tasks
      },
    });

    // Should pass validation
    expect(() => generator({ value: 'test' })).not.toThrow();

    // Should fail validation
    expect(() => generator({ value: 123 as unknown as string })).toThrow();
  });

  it('supports task dependencies and exports', () => {
    const generator = createGenerator({
      name: 'test-generator',
      generatorFileUrl: import.meta.url,
      buildTasks: (taskBuilder) => {
        const task1 = taskBuilder.addTask({
          name: 'task1',
          exports: {
            test: testProviderType.export(),
          },
          run: () => ({
            providers: { test: { value: 'test' } },
          }),
        });

        taskBuilder.addTask({
          name: 'task2',
          dependencies: {
            test: test2ProviderType,
          },
          taskDependencies: { task1 },
          run: () => ({}),
        });
      },
    });

    const bundle = generator({});
    expect(bundle.tasks).toHaveLength(2);
    expect(bundle.tasks[0].exports?.test.name).toEqual(testProviderType.name);
    expect(bundle.tasks[1].taskDependencies).toEqual(['task1']);
    expect(bundle.tasks[1].dependencies?.test.name).toEqual(
      test2ProviderType.name,
    );
  });

  it('supports task output', async () => {
    let task1Output: string | undefined;
    const generator = createGenerator({
      name: 'test-generator',
      generatorFileUrl: import.meta.url,
      buildTasks: (taskBuilder) => {
        const task1 = taskBuilder.addTask({
          name: 'task1',
          run: () => ({
            build: () => 'task1-output',
          }),
        });

        taskBuilder.addTask({
          name: 'task2',
          taskDependencies: { task1 },
          run: (_, { task1 }) => {
            task1Output = task1;
            return {};
          },
        });
      },
    });

    const bundle = generator({});
    expect(bundle.tasks).toHaveLength(2);
    const { build } = bundle.tasks[0].run({});
    await build?.({} as unknown as GeneratorTaskOutputBuilder);
    bundle.tasks[1].run({});
    expect(task1Output).toEqual('task1-output');
  });

  it('supports custom scopes', () => {
    const testScope = createProviderExportScope('test-scope', 'test');
    const generator = createGenerator({
      name: 'test-generator',
      generatorFileUrl: import.meta.url,
      scopes: [testScope],
      buildTasks: () => {
        // No tasks
      },
    });

    const bundle = generator({});
    expect(bundle.scopes).toEqual([testScope]);
  });

  it('supports children in generator bundle', () => {
    const generator = createGenerator({
      name: 'test-generator',
      generatorFileUrl: import.meta.url,
      buildTasks: () => {
        // No tasks
      },
    });

    const childBundle = {
      name: 'child-generator',
      directory: '/test/child',
      scopes: [],
      children: {},
      tasks: [],
    };

    const bundle = generator({
      children: {
        child: childBundle,
      },
    });

    expect(bundle.children).toEqual({
      child: childBundle,
    });
  });
});
