import { testAction } from '@baseplate-dev/sync';
import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderRawTemplateFileAction } from './render-raw-template-action.js';
import { createRawTemplateFile, RAW_TEMPLATE_TYPE } from './types.js';

vi.mock('fs');
vi.mock('fs/promises');

beforeEach(() => {
  vol.reset();
});

describe('renderRawTemplateFileAction', () => {
  it('should write file from template path with template metadata', async () => {
    vol.fromJSON({
      '/root/pkg/test-generator/templates/test.txt': 'test content',
    });

    const action = renderRawTemplateFileAction({
      template: createRawTemplateFile({
        name: 'test',
        source: {
          path: 'test.txt',
        },
        fileOptions: {
          kind: 'instance',
          generatorTemplatePath: 'test.txt',
        },
      }),
      id: 'test-id',
      destination: 'output/test.txt',
    });

    const output = await testAction(action, {
      generatorInfo: {
        name: 'test-generator',
        baseDirectory: '/root/pkg/test-generator',
      },
      templateMetadataOptions: {
        includeTemplateMetadata: true,
        shouldGenerateMetadata: () => true,
      },
    });

    expect(output.files.size).toBe(1);
    const file = output.files.get('output/test.txt');
    expect(file?.id).toBe('test-generator:test-id');
    expect(file?.contents).toEqual(Buffer.from('test content'));
    expect(file?.options?.templateMetadata).toEqual({
      name: 'test',
      template: '',
      generator: 'test-generator',
      type: RAW_TEMPLATE_TYPE,
      fileOptions: {
        kind: 'instance',
        generatorTemplatePath: 'test.txt',
      },
    });
  });

  it('should write file from template contents', async () => {
    const action = renderRawTemplateFileAction({
      template: createRawTemplateFile({
        name: 'test',
        source: {
          contents: Buffer.from('test content'),
        },
        fileOptions: {
          kind: 'instance',
          generatorTemplatePath: 'test.txt',
        },
      }),
      id: 'test-id',
      destination: 'output/test.txt',
    });

    const output = await testAction(action);

    expect(output.files.size).toBe(1);
    const file = output.files.get('output/test.txt');
    expect(file?.id).toBe('test-generator:test-id');
    expect(file?.contents).toEqual(Buffer.from('test content'));
    expect(file?.options?.templateMetadata).toBeUndefined();
  });
});
