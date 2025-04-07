import { describe, expect, it } from 'vitest';

import { tsCodeFragment } from '../fragments/creators.js';
import { tsImportBuilder } from '../imports/builder.js';
import { renderTsCodeFileTemplate } from './file.js';

describe('renderTsCodeFileTemplate', () => {
  it('should render a simple template without imports', async () => {
    const template = {
      name: 'test',
      source: { contents: 'const value = TPL_CONTENT;' },
      variables: {
        TPL_CONTENT: {},
      },
    };

    const variables = {
      TPL_CONTENT: tsCodeFragment('42'),
    };

    const result = await renderTsCodeFileTemplate(template, variables, {
      importMapProviders: {},
    });
    expect(result).toBe('const value = 42;');
  });

  it('should properly merge and sort imports', async () => {
    const template = {
      name: 'test',
      source: { contents: 'TPL_IMPORTS' },
      variables: {
        TPL_IMPORTS: {},
      },
    };

    const variables = {
      TPL_IMPORTS: tsCodeFragment(
        'const myVar = new MyClass();\nconst utils = getUtils();',
        [
          tsImportBuilder().named('MyClass').from('./my-class'),
          tsImportBuilder().default('getUtils').from('./utils'),
          tsImportBuilder().named('type MyType').typeOnly().from('./types'),
        ],
      ),
    };

    const result = await renderTsCodeFileTemplate(template, variables, {
      importMapProviders: {},
    });

    expect(result).toMatchInlineSnapshot(`
      "import type { type MyType } from "./types";

      import { MyClass } from "./my-class";
      import getUtils from "./utils";

      const myVar = new MyClass();
      const utils = getUtils();"
    `);
  });

  it('should handle module resolution when provided', async () => {
    const template = {
      name: 'test',
      source: { contents: 'TPL_CONTENT' },
      variables: {
        TPL_CONTENT: {},
      },
    };

    const variables = {
      TPL_CONTENT: tsCodeFragment(
        'const test = new Test();',
        tsImportBuilder().named('Test').from('./test'),
      ),
    };

    const result = await renderTsCodeFileTemplate(template, variables, {
      resolveModule: (moduleSpecifier) => `@project/${moduleSpecifier}`,
      importMapProviders: {},
    });

    expect(result).toMatchInlineSnapshot(`
      "import { Test } from "@project/./test";

      const test = new Test();"
    `);
  });

  it('should handle hoisted fragments in correct order', async () => {
    const template = {
      name: 'test',
      source: { contents: 'TPL_CONTENT' },
      variables: {
        TPL_CONTENT: {},
      },
    };

    const variables = {
      TPL_CONTENT: tsCodeFragment(
        'import { foo } from "./add2.js";\nconst x = helper1() + helper2();',
        [tsImportBuilder().default('test').from('./test.js')],
        {
          hoistedFragments: [
            {
              key: 'helper1',
              fragment: tsCodeFragment('function helper1() { return 42; }'),
              position: 'beforeImports',
            },
            {
              key: 'helper2',
              fragment: tsCodeFragment('function helper2() { return 24; }'),
              position: 'afterImports',
            },
          ],
        },
      ),
    };

    const result = await renderTsCodeFileTemplate(template, variables, {
      importMapProviders: {},
    });

    expect(result).toMatchInlineSnapshot(
      `
      "function helper1() { return 42; }

      import { foo } from "./add2.js";
      import test from "./test.js";

      function helper2() { return 24; }

      const x = helper1() + helper2();"
    `,
    );
  });
});
