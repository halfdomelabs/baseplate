import { describe, expect, it } from 'vitest';

import { extractTsTemplateVariables } from './extract-ts-template-variables.js';

describe('extractTsTemplateVariables', () => {
  it('should extract template variables correctly', () => {
    const content = `
      /* TPL_NAME:START */
      const name = "John";
      /* TPL_NAME:END */
      
      /* TPL_AGE:START */
      const age = 30;
      /* TPL_AGE:END */

      /* TPL_NAME:START */
      const name = "John";
      /* TPL_NAME:END */
    `;

    const result = extractTsTemplateVariables(content);
    expect(result.content).toMatchInlineSnapshot(`
      "
            TPL_NAME
            
            TPL_AGE

            TPL_NAME
          "
    `);
    expect(result.variables).toEqual({
      TPL_NAME: {},
      TPL_AGE: {},
    });
  });

  it('should remove HOISTED blocks', () => {
    const content = `
      /* HOISTED:IMPORTS:START */
      import { something } from 'somewhere';
      /* HOISTED:IMPORTS:END */
      
      const test = 123;
    `;

    const result = extractTsTemplateVariables(content);
    expect(result.content).toMatchInlineSnapshot(`
      "
                  
            const test = 123;
          "
    `);
    expect(result.variables).toEqual({});
  });

  it('should handle TSX-style template variables in a React component', () => {
    const content = `
      import React from 'react';
      import { Layout } from '@components/Layout';
      
      export const PageTemplate = () => {
        const title = /* TPL_TITLE:START */ "Welcome" /* TPL_TITLE:END */;
        return (
          <Layout>
            {/* TPL_HEADER:START */}
            <Header title={title} />
            {/* TPL_HEADER:END */}
            
            <main>
              {/* TPL_CONTENT:START */}
              <Content>
                <h1>Hello World</h1>
                <p>This is some content</p>
              </Content>
              {/* TPL_CONTENT:END */}
            </main>

            {/* TPL_FOOTER:START */}
            <Footer copyright="2024" />
            {/* TPL_FOOTER:END */}
          </Layout>
        );
      };
    `;

    const result = extractTsTemplateVariables(content);
    expect(result.content).toMatchInlineSnapshot(`
      "
            import React from 'react';
            import { Layout } from '@components/Layout';
            
            export const PageTemplate = () => {
              const title = TPL_TITLE;
              return (
                <Layout>
                  <TPL_HEADER />
                  
                  <main>
                    <TPL_CONTENT />
                  </main>

                  <TPL_FOOTER />
                </Layout>
              );
            };
          "
    `);
    expect(result.variables).toEqual({
      TPL_TITLE: {},
      TPL_HEADER: {},
      TPL_CONTENT: {},
      TPL_FOOTER: {},
    });
  });

  it('should handle comment-style template variables', () => {
    const content = `
      /* TPL_DESCRIPTION:COMMENT:START */
      // Description comment
      /* TPL_DESCRIPTION:COMMENT:END */

      const Component = () => {
        /* TPL_TODO:COMMENT:START */
        // TODO: Implement error handling
        /* TPL_TODO:COMMENT:END */
        return null;
      };
    `;

    const result = extractTsTemplateVariables(content);
    expect(result.content).toMatchInlineSnapshot(`
      "
            /* TPL_DESCRIPTION */

            const Component = () => {
              /* TPL_TODO */
              return null;
            };
          "
    `);
    expect(result.variables).toEqual({
      TPL_DESCRIPTION: {},
      TPL_TODO: {},
    });
  });
});
