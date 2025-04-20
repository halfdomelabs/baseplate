import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { testAction } from '@src/output/builder-action-test-helpers.js';

import { renderTextTemplateFileAction } from './render-text-template-file-action.js';
import { createTextTemplateFile, TEXT_TEMPLATE_TYPE } from './types.js';

vi.mock('fs');
vi.mock('fs/promises');

beforeEach(() => {
  vol.reset();
});

describe('renderTextTemplateFileAction', () => {
  it('should write file from template path with template metadata and replace variables', async () => {
    vol.fromJSON({
      '/root/pkg/test-generator/templates/test.txt':
        'Hello {{TPL_NAME}}, welcome to {{TPL_PLACE}}!',
    });

    const action = renderTextTemplateFileAction({
      template: createTextTemplateFile({
        name: 'test',
        source: {
          path: 'test.txt',
        },
        variables: {
          TPL_NAME: { description: 'The name to greet' },
          TPL_PLACE: { description: 'The place to welcome to' },
        },
      }),
      id: 'test-id',
      destination: 'output/test.txt',
      variables: {
        TPL_NAME: 'John',
        TPL_PLACE: 'Baseplate',
      },
    });

    const output = await testAction(action, {
      generatorInfo: {
        name: 'test-generator',
        baseDirectory: '/root/pkg/test-generator',
      },
      templateMetadataOptions: {
        includeTemplateMetadata: true,
      },
    });

    expect(output.files.size).toBe(1);
    const file = output.files.get('output/test.txt');
    expect(file?.id).toBe('test-generator:test-id');
    expect(file?.contents).toEqual('Hello John, welcome to Baseplate!');
    expect(file?.options?.templateMetadata).toEqual({
      name: 'test',
      template: 'test.txt',
      generator: 'test-generator',
      type: TEXT_TEMPLATE_TYPE,
      variables: {
        TPL_NAME: {
          description: 'The name to greet',
          value: 'John',
        },
        TPL_PLACE: {
          description: 'The place to welcome to',
          value: 'Baseplate',
        },
      },
    });
  });

  it('should write file from template contents with variables', async () => {
    const action = renderTextTemplateFileAction({
      template: createTextTemplateFile({
        name: 'test',
        source: {
          contents: 'Hello {{TPL_NAME}}!',
        },
        variables: {
          TPL_NAME: { description: 'The name to greet' },
        },
      }),
      id: 'test-id',
      destination: 'output/test.txt',
      variables: {
        TPL_NAME: 'John',
      },
    });

    const output = await testAction(action);

    expect(output.files.size).toBe(1);
    const file = output.files.get('output/test.txt');
    expect(file?.id).toBe('test-generator:test-id');
    expect(file?.contents).toEqual('Hello John!');
    expect(file?.options?.templateMetadata).toBeUndefined();
  });

  it('should write a css file from template contents with variables', async () => {
    const action = renderTextTemplateFileAction({
      template: createTextTemplateFile({
        name: 'test',
        source: {
          contents: 'h1 {\n  color: red;\n}\n/* TPL_GLOBAL_STYLES */',
        },
        variables: {
          TPL_GLOBAL_STYLES: {
            description: 'Global styles to apply to the app',
          },
        },
      }),
      id: 'test-id',
      destination: 'output/test.css',
      variables: {
        TPL_GLOBAL_STYLES: 'body {\n  background-color: red;\n}',
      },
    });

    const output = await testAction(action);

    expect(output.files.size).toBe(1);
    const file = output.files.get('output/test.css');
    expect(file?.contents).toEqual(
      'h1 {\n  color: red;\n}\nbody {\n  background-color: red;\n}',
    );
  });

  it('should throw error when template contains variable value', async () => {
    vol.fromJSON({
      '/root/pkg/test-generator/templates/test.txt': 'Hello John {{TPL_NAME}}!',
    });

    const action = renderTextTemplateFileAction({
      template: createTextTemplateFile({
        name: 'test',
        source: {
          path: 'test.txt',
        },
        variables: {
          TPL_NAME: { description: 'The name to greet' },
        },
      }),
      id: 'test-id',
      destination: 'output/test.txt',
      variables: {
        TPL_NAME: 'John',
      },
    });

    await expect(
      testAction(action, {
        generatorInfo: {
          name: 'test-generator',
          baseDirectory: '/root/pkg/test-generator',
        },
      }),
    ).rejects.toThrow(
      'The pre-rendered template contains the value of a template variable',
    );
  });

  it('should throw error when required variable is missing', async () => {
    vol.fromJSON({
      '/root/pkg/test-generator/templates/test.txt':
        'Hello {{TPL_VAR}} {{TPL_NAME}}!',
    });

    const action = renderTextTemplateFileAction({
      template: createTextTemplateFile({
        name: 'test',
        source: {
          path: 'test.txt',
        },
        variables: {
          TPL_NAME: { description: 'The name to greet' },
        },
      }),
      id: 'test-id',
      destination: 'output/test.txt',
      variables: {
        TPL_NAME: '',
      },
    });

    await expect(
      testAction(action, {
        generatorInfo: {
          name: 'test-generator',
          baseDirectory: '/root/pkg/test-generator',
        },
      }),
    ).rejects.toThrow('Template variable not found: TPL_VAR');
  });

  it('should throw error when a variable is missing from the template', async () => {
    vol.fromJSON({
      '/root/pkg/test-generator/templates/test.txt': 'Hello {{TPL_VAR}}!',
    });

    const action = renderTextTemplateFileAction({
      template: createTextTemplateFile({
        name: 'test',
        source: {
          path: 'test.txt',
        },
        variables: {
          TPL_VAR: { description: 'The variable to greet' },
          TPL_NAME: { description: 'The name to greet' },
        },
      }),
      id: 'test-id',
      destination: 'output/test.txt',
      variables: {
        TPL_VAR: 'John',
        TPL_NAME: '',
      },
    });

    await expect(
      testAction(action, {
        generatorInfo: {
          name: 'test-generator',
          baseDirectory: '/root/pkg/test-generator',
        },
      }),
    ).rejects.toThrow('Template variable not found in template: TPL_NAME');
  });
});
