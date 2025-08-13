import { createProviderType, testAction } from '@baseplate-dev/sync';
import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { tsCodeFragment } from '../fragments/creators.js';
import {
  createTsImportMap,
  createTsImportMapSchema,
} from '../import-maps/ts-import-map.js';
import { tsImportBuilder } from '../imports/builder.js';
import { createTsTemplateFile } from '../templates/types.js';
import { renderTsTemplateFileAction } from './render-ts-template-file-action.js';

vi.mock('fs');
vi.mock('fs/promises');

beforeEach(() => {
  vol.reset();
});

describe('renderTsTemplateFileAction', () => {
  it('should write file from template path with template metadata and replace variables', async () => {
    const testPath = '/root/pkg/test-generator/templates/test.ts';
    vol.fromJSON({
      [testPath]: 'const greeting = TPL_GREETING;',
    });

    const action = renderTsTemplateFileAction({
      template: createTsTemplateFile({
        name: 'test',
        source: {
          path: testPath,
        },
        variables: {
          TPL_GREETING: {},
        },
        fileOptions: { kind: 'singleton' },
      }),
      id: 'test-id',
      destination: 'output/test.ts',
      variables: {
        TPL_GREETING: tsCodeFragment('"Hello World"'),
      },
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
    const file = output.files.get('output/test.ts');
    expect(file?.id).toBe('test-generator:test-id');
    expect(file?.contents).toEqual(
      'const greeting = /* TPL_GREETING:START */ "Hello World" /* TPL_GREETING:END */;',
    );
    expect(file?.options?.templateInfo).toEqual({
      template: 'test',
      generator: 'test-generator',
      instanceData: {},
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
          TPL_GREETING: {},
        },
        fileOptions: { kind: 'singleton' },
      }),
      id: 'test-id',
      destination: 'output/test.ts',
      variables: {
        TPL_GREETING: tsCodeFragment('new Greeting("Hello")', [
          tsImportBuilder().named('Greeting').from('./greeting'),
        ]),
      },
    });

    const output = await testAction(action);

    expect(output.files.size).toBe(1);
    const file = output.files.get('output/test.ts');
    expect(file?.id).toBe('test-generator:test-id');
    expect(file?.contents).toEqual(
      'import { Greeting } from "./greeting";\n\nconst greeting = new Greeting("Hello");',
    );
    expect(file?.options?.templateInfo).toBeUndefined();
  });

  it('should throw error when template variables and provided variables do not match', async () => {
    const action = renderTsTemplateFileAction({
      template: createTsTemplateFile({
        name: 'test',
        source: {
          contents: 'const greeting = TPL_GREETING;',
        },
        variables: {
          TPL_GREETING: {},
          TPL_NAME: {},
        },
        fileOptions: { kind: 'singleton' },
      }),
      id: 'test-id',
      destination: 'output/test.ts',
      variables: {
        TPL_GREETING: tsCodeFragment('"Hello"'),
      } as never,
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

  it('should handle multiple import maps in template file action', async () => {
    const importMapSchema1 = createTsImportMapSchema({
      Test1: { exportedAs: 'Test1' },
    });

    const importMapSchema2 = createTsImportMapSchema({
      Test2: { exportedAs: 'Test2' },
    });

    const importMap1 = createTsImportMap(importMapSchema1, {
      Test1: 'test-package1',
    });

    const importMap2 = createTsImportMap(importMapSchema2, {
      Test2: 'test-package2',
    });

    const action = renderTsTemplateFileAction({
      template: createTsTemplateFile({
        name: 'test',
        source: {
          contents: `
            import { Test1 } from "%testImport1";
            import { Test2 } from "%testImport2";

            const greeting = TPL_GREETING;
            const test1 = new Test1();
            const test2 = new Test2();
          `,
        },
        variables: {
          TPL_GREETING: {},
        },
        importMapProviders: {
          testImport1: createProviderType('test-import-1'),
          testImport2: createProviderType('test-import-2'),
        },
        fileOptions: { kind: 'singleton' },
      }),
      id: 'test-id',
      destination: 'output/test.ts',
      variables: {
        TPL_GREETING: tsCodeFragment('"world"'),
      },
      importMapProviders: {
        testImport1: importMap1,
        testImport2: importMap2,
      },
    });

    const output = await testAction(action);

    expect(output.files.size).toBe(1);
    const file = output.files.get('output/test.ts');
    expect(file?.id).toBe('test-generator:test-id');
    expect(file?.contents).toMatchInlineSnapshot(`
      "import { Test1 } from "test-package1";
      import { Test2 } from "test-package2";


                                          const greeting = "world";
                  const test1 = new Test1();
                  const test2 = new Test2();
                "
    `);
  });
});
