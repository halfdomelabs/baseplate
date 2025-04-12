import { TemplateFileExtractorTestUtils } from '@halfdomelabs/sync';
import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TS_TEMPLATE_TYPE } from '../templates/types.js';
import { TsTemplateFileExtractor } from './ts-template-file-extractor.js';

vi.mock('node:fs/promises');
vi.mock('node:fs');

beforeEach(() => {
  vol.reset();
  vi.clearAllMocks();
});

describe('TsTemplateFileExtractor', () => {
  it('should extract TS template file, replace variables, remove hoisted, and clean imports', async () => {
    const context =
      TemplateFileExtractorTestUtils.createTestTemplateFileExtractorContext();
    const extractor = new TsTemplateFileExtractor(context);

    const inputFilePath = '/root/src/my-component.ts';
    const templatePath = 'my-component.ts'; // Relative path for metadata/output

    vol.fromJSON({
      [inputFilePath]: `
import { A, B, C, D } from './stuff'; // C and D are unused after processing
import { Z } from './unused-import';

/* HOISTED:HELPER_FN:START */
function helper() {
  console.log('This should be removed');
}
/* HOISTED:HELPER_FN:END */

export function /* TPL_COMPONENT_NAME:START */MyComponent/* TPL_COMPONENT_NAME:END */() {
  const msg = /* TPL_MESSAGE:START */'hello'/* TPL_MESSAGE:END */;
  const x: A = new A();
  const y: B = { prop: /* TPL_PROP_VALUE:START */123/* TPL_PROP_VALUE:END */ };
  return \`\${msg} \${x} \${y}\`;
}

// Another hoisted block
/* HOISTED:ANOTHER:START */
const removedVar = 1;
/* HOISTED:ANOTHER:END */
      `,
    });

    await extractor.extractTemplateFiles([
      {
        path: inputFilePath,
        metadata: {
          name: 'myComponentTemplate', // Camelcase name for the template object
          type: TS_TEMPLATE_TYPE,
          generator: TemplateFileExtractorTestUtils.TEST_GENERATOR_NAME,
          template: templatePath, // Path relative to templates dir
          variables: {
            TPL_COMPONENT_NAME: {},
            TPL_MESSAGE: {},
            TPL_PROP_VALUE: {},
          },
        },
      },
    ]);

    const result = vol.toJSON();
    const generatedTemplatePath =
      TemplateFileExtractorTestUtils.templatePath(templatePath);
    const generatedDefinitionPath =
      TemplateFileExtractorTestUtils.generatedPath('ts-templates.ts');

    // 1. Check the generated template file content
    expect(result[generatedTemplatePath]).toBeDefined();
    expect(result[generatedTemplatePath]).toContain('TPL_COMPONENT_NAME');
    expect(result[generatedTemplatePath]).toContain('TPL_MESSAGE');
    expect(result[generatedTemplatePath]).toContain('TPL_PROP_VALUE');
    expect(result[generatedTemplatePath]).not.toContain('/* HOISTED:');
    expect(result[generatedTemplatePath]).not.toContain('helper()');
    expect(result[generatedTemplatePath]).not.toContain('unused-import'); // Import should be removed
    expect(result[generatedTemplatePath]).not.toContain(' C, D'); // Unused named import C
    expect(result[generatedTemplatePath]).toContain(' A, B '); // Used named imports A and B

    // Snapshot the template file for detailed verification
    expect(result[generatedTemplatePath]).toMatchInlineSnapshot(`
      "import { A, B } from './stuff'; // C and D are unused after processing

      export function TPL_COMPONENT_NAME() {
        const msg = TPL_MESSAGE;
        const x: A = new A();
        const y: B = { prop: TPL_PROP_VALUE };
        return \`\${msg} \${x} \${y}\`;
      }

      // Another hoisted block
      "
    `);

    // 2. Check the generated definition file content
    expect(result[generatedDefinitionPath]).toBeDefined();
    expect(result[generatedDefinitionPath]).toMatchInlineSnapshot(`
      "import { createTsTemplateFile } from '@halfdomelabs/core-generators';

      const myComponentTemplate = createTsTemplateFile({
        name: 'myComponentTemplate',
        source: { path: 'my-component.ts' },
        variables: { TPL_COMPONENT_NAME: {}, TPL_MESSAGE: {}, TPL_PROP_VALUE: {} },
      });

      export const TEST_GENERATOR_TS_TEMPLATES = {
        myComponentTemplate,
      };
      "
    `);
  });
});
