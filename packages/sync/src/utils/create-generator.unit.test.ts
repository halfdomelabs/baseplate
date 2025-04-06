import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import type { GeneratorTaskOutputBuilder } from '@src/output/generator-task-output.js';

import { createGeneratorTask } from '@src/generators/index.js';
import { createProviderExportScope } from '@src/providers/index.js';

import { createGenerator } from './create-generator.js';

describe('createGenerator', () => {
  it('creates a basic generator with no descriptor schema', () => {
    const generator = createGenerator({
      name: 'test-generator',
      generatorFileUrl: import.meta.url,
      buildTasks: () => ({
        testTask: createGeneratorTask({
          run: () => ({
            build: (builder: GeneratorTaskOutputBuilder) => {
              builder.writeFile({
                id: 'test',
                filePath: 'test.txt',
                contents: 'content',
              });
            },
          }),
        }),
      }),
    });

    const bundle = generator({});

    expect(bundle).toMatchObject({
      name: 'test-generator',
      directory: path.dirname(fileURLToPath(import.meta.url)),
      scopes: [],
      children: {},
      tasks: {
        testTask: {
          run: expect.any(Function) as unknown,
        },
      },
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
      buildTasks: () => ({}),
    });

    // Should pass validation
    expect(() => generator({ value: 'test' })).not.toThrow();

    // Should fail validation
    expect(() => generator({ value: 123 as unknown as string })).toThrow();
  });

  it('supports custom scopes', () => {
    const testScope = createProviderExportScope('test-scope', 'test');
    const generator = createGenerator({
      name: 'test-generator',
      generatorFileUrl: import.meta.url,
      scopes: [testScope],
      buildTasks: () => ({}),
    });

    const bundle = generator({});
    expect(bundle.scopes).toEqual([testScope]);
  });

  it('supports children in generator bundle', () => {
    const generator = createGenerator({
      name: 'test-generator',
      generatorFileUrl: import.meta.url,
      buildTasks: () => ({}),
    });

    const childBundle = {
      name: 'child-generator',
      directory: '/test/child',
      scopes: [],
      children: {},
      tasks: {},
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
