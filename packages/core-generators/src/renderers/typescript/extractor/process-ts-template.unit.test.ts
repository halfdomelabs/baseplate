import { describe, expect, it } from 'vitest';

import {
  TS_TEMPLATE_TYPE,
  type TsTemplateFileMetadata,
} from '../templates/types.js';
import { processTsTemplateContent } from './process-ts-template.js';

describe('processTsTemplateContent', () => {
  it('should process template variables correctly', () => {
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
    `;

    const result = processTsTemplateContent(metadata, content);
    expect(result).toMatchInlineSnapshot(`
      "// @ts-nocheck


            TPL_NAME
            
            TPL_AGE
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

    const result = processTsTemplateContent(metadata, content);
    expect(result).toMatchInlineSnapshot(`
      "// @ts-nocheck


                  
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

    const result = processTsTemplateContent(metadata, content);
    expect(result).toMatchInlineSnapshot(`
      "// @ts-nocheck


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

    expect(() => processTsTemplateContent(metadata, content)).toThrow(
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

    expect(() => processTsTemplateContent(metadata, content)).toThrow(
      'The template is missing variables: TPL_AGE',
    );
  });
});
