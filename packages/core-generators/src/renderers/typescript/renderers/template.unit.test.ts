import { describe, expect, it } from 'vitest';

import { tsCodeFragment, tsHoistedFragment } from '../fragments/creators.js';
import { tsImportBuilder } from '../imports/builder.js';
import { renderTsTemplateToTsCodeFragment } from './template.js';

describe('renderTsTemplateToTsCodeFragment', () => {
  it('should replace template variables with their values', () => {
    const template = `
      function TPL_FUNCTION_NAME() {
        return TPL_RETURN_VALUE; // TPL_FUNCTION_NAME
      }
    `;

    const variables = {
      TPL_FUNCTION_NAME: {
        contents: 'sayHello',
      },
      TPL_RETURN_VALUE: {
        contents: '"Hello, World!"',
      },
    };

    const result = renderTsTemplateToTsCodeFragment(template, variables);

    expect(result.contents).toEqual(`
      function sayHello() {
        return "Hello, World!"; // sayHello
      }
    `);
    expect(result.imports).toEqual([]);
    expect(result.hoistedFragments).toEqual([]);
  });

  it('should include metadata when option is enabled', () => {
    const template =
      'const name = TPL_VARIABLE;\nTPL_BLOCK;\nconst inlineBlock = TPL_BLOCK;';
    const variables = {
      TPL_VARIABLE: {
        contents: '"test"',
      },
      TPL_BLOCK: {
        contents: 'console.log(name)',
      },
    };

    const result = renderTsTemplateToTsCodeFragment(template, variables, {
      includeMetadata: true,
    });

    expect(result.contents).toMatchInlineSnapshot(`
      "const name = /* TPL_VARIABLE:START */ "test" /* TPL_VARIABLE:END */;
      /* TPL_BLOCK:START */
      console.log(name)
      /* TPL_BLOCK:END */
      const inlineBlock = /* TPL_BLOCK:START */ console.log(name) /* TPL_BLOCK:END */;"
    `);
  });

  it('should collect imports and hoisted fragments from variables', () => {
    const template = 'const value = TPL_COMPLEX_VALUE;';
    const variables = {
      TPL_COMPLEX_VALUE: tsCodeFragment(
        'new MyClass()',
        tsImportBuilder().named('MyClass').from('./my-class'),
        {
          hoistedFragments: [
            tsHoistedFragment(
              tsCodeFragment('function helper() { return true; }', []),
              'helper',
            ),
          ],
        },
      ),
    };

    const result = renderTsTemplateToTsCodeFragment(template, variables);

    expect(result.imports).toHaveLength(1);
    expect(result.imports?.[0]).toMatchObject({
      source: './my-class',
    });
    expect(result.hoistedFragments).toHaveLength(1);
    expect(result.hoistedFragments?.[0].key).toBe('helper');
  });

  it('should throw error for invalid variable keys', () => {
    const template = 'const value = invalid_key;';
    const variables = {
      invalid_key: {
        contents: '"test"',
      },
    };

    expect(() => renderTsTemplateToTsCodeFragment(template, variables)).toThrow(
      'Template variable keys must be uppercase alphanumeric',
    );
  });

  it('should strip ts-nocheck from header', () => {
    const template = '// @ts-nocheck\nconst value = TPL_VARIABLE;';
    const variables = {
      TPL_VARIABLE: {
        contents: '"test"',
      },
    };

    const result = renderTsTemplateToTsCodeFragment(template, variables);

    expect(result.contents).not.toContain('// @ts-nocheck');
    expect(result.contents).toContain('const value = "test"');
  });
});
