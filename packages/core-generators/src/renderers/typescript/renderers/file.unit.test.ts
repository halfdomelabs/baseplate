import { describe, expect, it } from 'vitest';

import { tsCodeFragment } from '../fragments/creators.js';
import {
  createTsImportMap,
  createTsImportMapSchema,
} from '../import-maps/ts-import-map.js';
import { tsImportBuilder } from '../imports/builder.js';
import { renderTsCodeFileTemplate } from './file.js';

describe('renderTsCodeFileTemplate', () => {
  it('should render a simple template without imports', () => {
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

    const result = renderTsCodeFileTemplate(
      template.source.contents,
      variables,
    );
    expect(result).toBe('const value = 42;');
  });

  it('should properly merge and sort imports', () => {
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

    const result = renderTsCodeFileTemplate(
      template.source.contents,
      variables,
    );

    expect(result).toMatchInlineSnapshot(`
      "import type { type MyType } from "./types";

      import { MyClass } from "./my-class";
      import getUtils from "./utils";

      const myVar = new MyClass();
      const utils = getUtils();"
    `);
  });

  it('should handle module resolution when provided', () => {
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

    const result = renderTsCodeFileTemplate(
      template.source.contents,
      variables,
      {},
      {
        resolveModule: (moduleSpecifier) => `@project/${moduleSpecifier}`,
      },
    );

    expect(result).toMatchInlineSnapshot(`
      "import { Test } from "@project/./test";

      const test = new Test();"
    `);
  });

  it('should handle hoisted fragments in correct order', () => {
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

    const result = renderTsCodeFileTemplate(
      template.source.contents,
      variables,
    );

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

  it('should handle multiple import maps correctly', () => {
    const template = {
      name: 'test',
      source: {
        contents: `
        import { Test1 } from "%testImport1";
        import { Test2 } from "%testImport2";

        const test1 = new Test1();
        const test2 = new Test2();
      `,
      },
    };

    const importMapSchema1 = createTsImportMapSchema({
      Test1: { name: 'Test1' },
    });

    const importMapSchema2 = createTsImportMapSchema({
      Test2: { name: 'Test2' },
    });

    const importMap1 = createTsImportMap(importMapSchema1, {
      Test1: 'test-package1',
    });

    const importMap2 = createTsImportMap(importMapSchema2, {
      Test2: 'test-package2',
    });

    const result = renderTsCodeFileTemplate(
      template.source.contents,
      {},
      {
        testImport1: { importMap: importMap1 },
        testImport2: { importMap: importMap2 },
      },
    );

    expect(result).toMatchInlineSnapshot(`
      "import { Test1 } from "test-package1";
      import { Test2 } from "test-package2";


                              const test1 = new Test1();
              const test2 = new Test2();
            "
    `);
  });
});
