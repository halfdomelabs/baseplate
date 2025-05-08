import { describe, expect, it } from 'vitest';

import {
  TS_TEMPLATE_TYPE,
  type TsTemplateFileMetadata,
} from '../templates/types.js';
import { stripTsTemplateVariables } from './strip-ts-template-variables.js';

describe('stripTsTemplateVariables', () => {
  it('should strip template variables correctly', () => {
    const metadata: TsTemplateFileMetadata = {
      type: TS_TEMPLATE_TYPE,
      name: 'test-template',
      generator: 'test-generator',
      template: 'test-template.ts',
      variables: {
        TPL_NAME: { description: 'Name variable' },
        TPL_AGE: { description: 'Age variable' },
      },
    };

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

    const result = stripTsTemplateVariables(metadata, content);
    expect(result).toMatchInlineSnapshot(`
      "
            TPL_NAME
            
            TPL_AGE

            TPL_NAME
          "
    `);
  });

  it('should remove HOISTED blocks', () => {
    const metadata: TsTemplateFileMetadata = {
      type: TS_TEMPLATE_TYPE,
      name: 'test-template',
      generator: 'test-generator',
      template: 'test-template.ts',
      variables: {},
    };

    const content = `
      /* HOISTED:IMPORTS:START */
      import { something } from 'somewhere';
      /* HOISTED:IMPORTS:END */
      
      const test = 123;
    `;

    const result = stripTsTemplateVariables(metadata, content);
    expect(result).toMatchInlineSnapshot(`
      "
                  
            const test = 123;
          "
    `);
  });

  it('should clean up unused imports using ts-morph', () => {
    const metadata: TsTemplateFileMetadata = {
      type: TS_TEMPLATE_TYPE,
      name: 'test-template',
      generator: 'test-generator',
      template: 'test-template.ts',
      variables: {
        TPL_NAME: { description: 'Name variable' },
      },
    };

    const content = `
      import { unused } from 'unused-package';
      import { used } from 'used-package';

      /* TPL_NAME:START */
      const name = 'John';
      /* TPL_NAME:END */

      const test = used();
    `;

    const result = stripTsTemplateVariables(metadata, content);
    expect(result).toMatchInlineSnapshot(`
      "
            import { unused } from 'unused-package';
            import { used } from 'used-package';

            TPL_NAME

            const test = used();
          "
    `);
  });

  it('should throw error for unknown template variables', () => {
    const metadata: TsTemplateFileMetadata = {
      type: TS_TEMPLATE_TYPE,
      name: 'test-template',
      generator: 'test-generator',
      template: 'test-template.ts',
      variables: {
        TPL_NAME: { description: 'Name variable' },
      },
    };

    const content = `
      /* TPL_UNKNOWN:START */
      const test = 123;
      /* TPL_UNKNOWN:END */
    `;

    expect(() => stripTsTemplateVariables(metadata, content)).toThrow(
      'Found unknown template variable: TPL_UNKNOWN',
    );
  });

  it('should throw error for missing template variables', () => {
    const metadata: TsTemplateFileMetadata = {
      type: TS_TEMPLATE_TYPE,
      name: 'test-template',
      generator: 'test-generator',
      template: 'test-template.ts',
      variables: {
        TPL_NAME: { description: 'Name variable' },
        TPL_AGE: { description: 'Age variable' },
      },
    };

    const content = `
      /* TPL_NAME:START */
      const name = "John";
      /* TPL_NAME:END */
    `;

    expect(() => stripTsTemplateVariables(metadata, content)).toThrow(
      'The template is missing variables: TPL_AGE',
    );
  });

  it('should handle TSX-style template variables in a React component', () => {
    const metadata: TsTemplateFileMetadata = {
      type: TS_TEMPLATE_TYPE,
      name: 'test-template',
      generator: 'test-generator',
      template: 'test-template.tsx',
      variables: {
        TPL_TITLE: { description: 'Title variable' },
        TPL_HEADER: { description: 'Header component' },
        TPL_CONTENT: { description: 'Content component' },
        TPL_FOOTER: { description: 'Footer component' },
      },
    };

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

    const result = stripTsTemplateVariables(metadata, content);
    expect(result).toMatchInlineSnapshot(`
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
  });

  it('should handle comment-style template variables', () => {
    const metadata: TsTemplateFileMetadata = {
      type: TS_TEMPLATE_TYPE,
      name: 'test-template',
      generator: 'test-generator',
      template: 'test-template.ts',
      variables: {
        TPL_DESCRIPTION: { description: 'Description comment' },
        TPL_TODO: { description: 'Todo comment' },
      },
    };

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

    const result = stripTsTemplateVariables(metadata, content);
    expect(result).toMatchInlineSnapshot(`
      "
            /* TPL_DESCRIPTION */

            const Component = () => {
              /* TPL_TODO */
              return null;
            };
          "
    `);
  });
});
