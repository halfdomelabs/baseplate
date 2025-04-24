import { createProviderType, testAction } from '@halfdomelabs/sync';
import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { tsCodeFragment } from '../fragments/creators.js';
import {
  createTsImportMap,
  createTsImportMapSchema,
} from '../import-maps/ts-import-map.js';
import { tsImportBuilder } from '../imports/builder.js';
import {
  createTsTemplateFile,
  createTsTemplateGroup,
} from '../templates/types.js';
import { renderTsTemplateGroupAction } from './render-ts-template-group-action.js';

vi.mock('fs');
vi.mock('fs/promises');

beforeEach(() => {
  vol.reset();
});

describe('renderTsTemplateGroupAction', () => {
  it('should render multiple templates in a group with variables', async () => {
    vol.fromJSON({
      '/root/pkg/test-generator/templates/greeting.ts':
        'const greeting = TPL_GREETING;',
      '/root/pkg/test-generator/templates/welcome.ts':
        'const welcome = TPL_WELCOME;',
    });

    const group = createTsTemplateGroup({
      templates: {
        greeting: {
          destination: 'output/greeting.ts',
          template: createTsTemplateFile({
            name: 'greeting',
            source: {
              path: 'greeting.ts',
            },
            variables: {
              TPL_GREETING: { description: 'The greeting to use' },
            },
          }),
        },
        welcome: {
          destination: 'output/welcome.ts',
          template: createTsTemplateFile({
            name: 'welcome',
            source: {
              path: 'welcome.ts',
            },
            variables: {
              TPL_WELCOME: { description: 'The welcome message' },
            },
          }),
        },
      },
    });

    const action = renderTsTemplateGroupAction({
      group,
      baseDirectory: 'src',
      variables: {
        greeting: {
          TPL_GREETING: tsCodeFragment('"Hello World"'),
        },
        welcome: {
          TPL_WELCOME: tsCodeFragment('"Welcome to Baseplate"'),
        },
      },
    });

    const output = await testAction(action, {
      generatorInfo: {
        name: 'test-generator',
        baseDirectory: '/root/pkg/test-generator',
      },
    });

    expect(output.files.size).toBe(2);

    const greetingFile = output.files.get('src/output/greeting.ts');
    expect(greetingFile?.contents).toEqual('const greeting = "Hello World";');

    const welcomeFile = output.files.get('src/output/welcome.ts');
    expect(welcomeFile?.contents).toEqual(
      'const welcome = "Welcome to Baseplate";',
    );
  });

  it('should handle templates with imports with custom resolveModule', async () => {
    const group = createTsTemplateGroup({
      templates: {
        greeting: {
          destination: 'output/greeting.ts',
          template: createTsTemplateFile({
            name: 'greeting',
            source: {
              contents: 'const greeting = TPL_GREETING;',
            },
            variables: {
              TPL_GREETING: { description: 'The greeting to use' },
            },
          }),
        },
      },
    });

    const action = renderTsTemplateGroupAction({
      group,
      baseDirectory: 'src',
      variables: {
        greeting: {
          TPL_GREETING: tsCodeFragment('new Greeting("Hello")', [
            tsImportBuilder().named('Greeting').from('greeting'),
          ]),
        },
      },
      renderOptions: {
        resolveModule: (moduleSpecifier, sourceDirectory) =>
          `@project/${sourceDirectory}/${moduleSpecifier}`,
      },
    });

    const output = await testAction(action);

    expect(output.files.size).toBe(1);
    const file = output.files.get('src/output/greeting.ts');
    expect(file?.contents).toEqual(
      'import { Greeting } from "@project/src/output/greeting";\n\nconst greeting = new Greeting("Hello");',
    );
  });

  it('should handle import maps in template group action', async () => {
    const importMapSchema = createTsImportMapSchema({
      Test: { name: 'Test' },
    });

    const importMap = createTsImportMap(importMapSchema, {
      Test: 'test-package',
    });

    const importProvider =
      createProviderType<typeof importMap>('test-provider');

    const group = createTsTemplateGroup({
      templates: {
        test1: {
          destination: 'test1.ts',
          template: createTsTemplateFile({
            name: 'test1',
            source: {
              contents: `
                import { Test } from "%testImport";

                const test = new Test();
              `,
            },
            variables: {},
            importMapProviders: {
              testImport: importProvider,
            },
          }),
        },
        test2: {
          destination: 'test2.ts',
          template: createTsTemplateFile({
            name: 'test2',
            source: {
              contents: `
                import { Test } from "%testImport";

                const test = new Test();
              `,
            },
            variables: {},
            importMapProviders: {
              testImport: importProvider,
            },
          }),
        },
      },
    });

    const action = renderTsTemplateGroupAction({
      group,
      baseDirectory: 'output',
      importMapProviders: {
        testImport: importMap,
      },
    });

    const output = await testAction(action);

    expect(output.files.size).toBe(2);

    const file1 = output.files.get('output/test1.ts');
    expect(file1?.contents).toMatchInlineSnapshot(`
      "import { Test } from "test-package";


                                      const test = new Test();
                    "
    `);

    const file2 = output.files.get('output/test2.ts');
    expect(file2?.contents).toMatchInlineSnapshot(`
      "import { Test } from "test-package";


                                      const test = new Test();
                    "
    `);
  });
});
