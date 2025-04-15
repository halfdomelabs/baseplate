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
});
