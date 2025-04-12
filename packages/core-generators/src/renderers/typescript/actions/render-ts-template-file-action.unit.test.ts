import { testAction } from '@halfdomelabs/sync';
import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { tsCodeFragment } from '../fragments/creators.js';
import { tsImportBuilder } from '../imports/builder.js';
import { createTsTemplateFile, TS_TEMPLATE_TYPE } from '../templates/types.js';
import { renderTsTemplateFileAction } from './render-ts-template-file-action.js';

vi.mock('fs');
vi.mock('fs/promises');

beforeEach(() => {
  vol.reset();
});

describe('renderTsTemplateFileAction', () => {
  it('should write file from template path with template metadata and replace variables', async () => {
    vol.fromJSON({
      '/root/pkg/test-generator/templates/test.ts':
        'const greeting = TPL_GREETING;',
    });

    const action = renderTsTemplateFileAction({
      template: createTsTemplateFile({
        name: 'test',
        source: {
          path: 'test.ts',
        },
        variables: {
          TPL_GREETING: { description: 'The greeting to use' },
        },
      }),
      id: 'test-id',
      destination: 'output/test.ts',
      variables: {
        TPL_GREETING: tsCodeFragment('"Hello World"'),
      },
      renderOptions: {
        importMapProviders: {},
      },
    });

    const output = await testAction(action, {
      generatorInfo: {
        name: 'test-generator',
        baseDirectory: '/root/pkg/test-generator',
      },
      includeTemplateMetadata: true,
    });

    expect(output.files.size).toBe(1);
    const file = output.files.get('output/test.ts');
    expect(file?.id).toBe('test-generator:test-id');
    expect(file?.contents).toEqual('const greeting = "Hello World";');
    expect(file?.options?.templateMetadata).toEqual({
      name: 'test',
      template: 'test.ts',
      generator: 'test-generator',
      type: TS_TEMPLATE_TYPE,
      variables: {
        TPL_GREETING: {
          description: 'The greeting to use',
        },
      },
    });
  });

  it('should write file from template contents with imports and variables', async () => {
    const action = renderTsTemplateFileAction({
      template: createTsTemplateFile({
        name: 'test',
        source: {
          contents: 'const greeting = TPL_GREETING;',
        },
        variables: {
          TPL_GREETING: { description: 'The greeting to use' },
        },
      }),
      id: 'test-id',
      destination: 'output/test.ts',
      variables: {
        TPL_GREETING: tsCodeFragment('new Greeting("Hello")', [
          tsImportBuilder().named('Greeting').from('./greeting'),
        ]),
      },
      renderOptions: {
        importMapProviders: {},
      },
    });

    const output = await testAction(action);

    expect(output.files.size).toBe(1);
    const file = output.files.get('output/test.ts');
    expect(file?.id).toBe('test-generator:test-id');
    expect(file?.contents).toEqual(
      'import { Greeting } from "./greeting";\n\nconst greeting = new Greeting("Hello");',
    );
    expect(file?.options?.templateMetadata).toBeUndefined();
  });

  it('should throw error when template variables and provided variables do not match', async () => {
    const action = renderTsTemplateFileAction({
      template: createTsTemplateFile({
        name: 'test',
        source: {
          contents: 'const greeting = TPL_GREETING;',
        },
        variables: {
          TPL_GREETING: { description: 'The greeting to use' },
          TPL_NAME: { description: 'The name to greet' },
        },
      }),
      id: 'test-id',
      destination: 'output/test.ts',
      variables: {
        TPL_GREETING: tsCodeFragment('"Hello"'),
      } as never,
      renderOptions: {
        importMapProviders: {},
      },
    });

    await expect(
      testAction(action, {
        generatorInfo: {
          name: 'test-generator',
          baseDirectory: '/root/pkg/test-generator',
        },
      }),
    ).rejects.toThrow('Template variables and provided variables do not match');
  });
});
