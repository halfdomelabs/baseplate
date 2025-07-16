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

    const result = renderTsCodeFileTemplate({
      templateContents: template.source.contents,
      variables,
    });
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

    const result = renderTsCodeFileTemplate({
      templateContents: template.source.contents,
      variables,
    });

    expect(result).toMatchInlineSnapshot(`
      "import type { type MyType } from "./types";

      import { MyClass } from "./my-class";
      import getUtils from "./utils";

      const myVar = new MyClass();
      const utils = getUtils();"
    `);
  });

  it('should handle shebang lines', () => {
    const template = {
      name: 'test',
      source: { contents: '#!/usr/bin/env node\nTPL_CONTENTS' },
      variables: {
        TPL_CONTENTS: {},
      },
    };

    const variables = {
      TPL_CONTENTS: tsCodeFragment('const myVar = new MyClass();', [
        tsImportBuilder().named('MyClass').from('./my-class'),
      ]),
    };

    const result = renderTsCodeFileTemplate({
      templateContents: template.source.contents,
      variables,
    });

    expect(result).toMatchInlineSnapshot(`
      "#!/usr/bin/env node

      import { MyClass } from "./my-class";

      const myVar = new MyClass();"
    `);
  });

  it('should handle module resolution when provided', () => {
    const template = {
      name: 'test',
      source: { contents: 'import "side-effect";\nTPL_CONTENT' },
      variables: {
        TPL_CONTENT: {},
      },
    };

    const variables = {
      TPL_CONTENT: tsCodeFragment(
        'const test = new Test();',
        tsImportBuilder().named('Test').from('test'),
      ),
    };

    const result = renderTsCodeFileTemplate({
      templateContents: template.source.contents,
      variables,
      importMapProviders: {},
      positionedHoistedFragments: [],
      options: {
        resolveModule: (moduleSpecifier) => `@project/${moduleSpecifier}`,
      },
    });

    expect(result).toMatchInlineSnapshot(`
      "import { Test } from "@project/test";

      import "@project/side-effect";
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
              key: 'helper2',
              contents: 'function helper2() { return 24; }',
            },
          ],
        },
      ),
    };

    const result = renderTsCodeFileTemplate({
      templateContents: template.source.contents,
      variables,
      importMapProviders: {},
      positionedHoistedFragments: [
        {
          key: 'helper1',
          contents: 'function helper1() { return 42; }',
          position: 'beforeImports',
        },
      ],
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

    const result = renderTsCodeFileTemplate({
      templateContents: template.source.contents,
      importMapProviders: {
        testImport1: importMap1,
        testImport2: importMap2,
      },
    });

    expect(result).toMatchInlineSnapshot(`
      "import { Test1 } from "test-package1";
      import { Test2 } from "test-package2";


                              const test1 = new Test1();
              const test2 = new Test2();
            "
    `);
  });

  describe('generatorPaths integration', () => {
    it('should pass generatorPaths to mergeImportsAndHoistedFragments', () => {
      const template = `
        import { Utils } from '$utils';
        import { Config } from '$config';
        
        export function setup() {
          return Utils.configure(Config);
        }
      `;

      const result = renderTsCodeFileTemplate({
        templateContents: template,
        generatorPaths: {
          utils: './utils/index.ts',
          config: './config.ts',
        },
      });

      expect(result).toMatchInlineSnapshot(`
        "import { Config } from "./config.ts";
        import { Utils } from "./utils/index.ts";


                                export function setup() {
                  return Utils.configure(Config);
                }
              "
      `);
    });
  });
});
