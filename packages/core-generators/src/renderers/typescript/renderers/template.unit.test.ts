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

  it('should handle inline variables followed by a comma', () => {
    const template = `const value = [TPL_VARIABLE, 123];`;
    const variables = {
      TPL_VARIABLE: {
        contents: '"test"',
      },
    };

    const result = renderTsTemplateToTsCodeFragment(template, variables);

    expect(result.contents).toEqual(`const value = ["test", 123];`);
  });

  it('should handle empty inline variables followed by a comma', () => {
    const template = `const value = [TPL_VARIABLE,123];`;
    const variables = {
      TPL_VARIABLE: {
        contents: '',
      },
    };

    const result = renderTsTemplateToTsCodeFragment(template, variables);

    expect(result.contents).toEqual(`const value = [123];`);
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
              'helper',
              tsCodeFragment('function helper() { return true; }', []),
            ),
          ],
        },
      ),
    };

    const result = renderTsTemplateToTsCodeFragment(template, variables);

    expect(result.imports).toHaveLength(1);
    expect(result.imports?.[0]).toMatchObject({
      moduleSpecifier: './my-class',
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

  it('should handle TSX-style template variables without metadata', () => {
    const template = `
      import React from 'react';
      
      export const Page = () => {
        const title = TPL_TITLE;
        return (
          <div>
            <TPL_HEADER />
            <main>
              <TPL_CONTENT />
            </main>
            <TPL_FOOTER />
          </div>
        );
      };
    `;

    const variables = {
      TPL_TITLE: {
        contents: '"Welcome"',
      },
      TPL_HEADER: {
        contents: '<Header title="Welcome" />',
      },
      TPL_CONTENT: {
        contents: '<Content>Hello World</Content>',
      },
      TPL_FOOTER: {
        contents: '<Footer copyright="2024" />',
      },
    };

    const result = renderTsTemplateToTsCodeFragment(template, variables);

    expect(result.contents).toMatchInlineSnapshot(`
      "
            import React from 'react';
            
            export const Page = () => {
              const title = "Welcome";
              return (
                <div>
                  <Header title="Welcome" />
                  <main>
                    <Content>Hello World</Content>
                  </main>
                  <Footer copyright="2024" />
                </div>
              );
            };
          "
    `);
  });

  it('should handle TSX-style template variables with metadata', () => {
    const template = `
      import React from 'react';
      
      export const Page = () => {
        const title = TPL_TITLE;
        return (
          <div>
            <TPL_HEADER />
            <main>
              <TPL_CONTENT />
            </main>
            <TPL_FOOTER />
          </div>
        );
      };
    `;

    const variables = {
      TPL_TITLE: {
        contents: '"Welcome"',
      },
      TPL_HEADER: {
        contents: '<Header />',
      },
      TPL_CONTENT: {
        contents: '<Content>Hello World</Content>',
      },
      TPL_FOOTER: {
        contents: '<Footer copyright="2024" />',
      },
    };

    const result = renderTsTemplateToTsCodeFragment(template, variables, {
      includeMetadata: true,
    });

    expect(result.contents).toMatchInlineSnapshot(`
      "
            import React from 'react';
            
            export const Page = () => {
              const title = /* TPL_TITLE:START */ "Welcome" /* TPL_TITLE:END */;
              return (
                <div>
                  {/* TPL_HEADER:START */}
      <Header />
      {/* TPL_HEADER:END */}
                  <main>
                    {/* TPL_CONTENT:START */}
      <Content>Hello World</Content>
      {/* TPL_CONTENT:END */}
                  </main>
                  {/* TPL_FOOTER:START */}
      <Footer copyright="2024" />
      {/* TPL_FOOTER:END */}
                </div>
              );
            };
          "
    `);
  });

  it('should handle comment-style template variables without metadata', () => {
    const template = `
      /* TPL_DESCRIPTION */
      
      const Component = () => {
        /* TPL_TODO */
        return null;
      };
    `;

    const variables = {
      TPL_DESCRIPTION: {
        contents: 'This is a component description',
      },
      TPL_TODO: {
        contents: 'TODO: Implement error handling',
      },
    };

    const result = renderTsTemplateToTsCodeFragment(template, variables);

    expect(result.contents).toMatchInlineSnapshot(`
      "
            This is a component description
            
            const Component = () => {
              TODO: Implement error handling
              return null;
            };
          "
    `);
  });

  it('should handle comment-style template variables with metadata', () => {
    const template = `
      /* TPL_DESCRIPTION */
      
      const Component = () => {
        /* TPL_TODO */
        return null;
      };
    `;

    const variables = {
      TPL_DESCRIPTION: {
        contents: 'This is a component description',
      },
      TPL_TODO: {
        contents: 'TODO: Implement error handling',
      },
    };

    const result = renderTsTemplateToTsCodeFragment(template, variables, {
      includeMetadata: true,
    });

    expect(result.contents).toMatchInlineSnapshot(`
      "
            /* TPL_DESCRIPTION:COMMENT:START */
      This is a component description
      /* TPL_DESCRIPTION:COMMENT:END */
            
            const Component = () => {
              /* TPL_TODO:COMMENT:START */
      TODO: Implement error handling
      /* TPL_TODO:COMMENT:END */
              return null;
            };
          "
    `);
  });
});
