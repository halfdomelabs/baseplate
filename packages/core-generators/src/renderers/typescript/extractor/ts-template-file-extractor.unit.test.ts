import type { ResolverFactory } from 'oxc-resolver';

import { TemplateFileExtractorTestUtils } from '@baseplate-dev/sync';
import { vol } from 'memfs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TS_TEMPLATE_TYPE } from '../templates/types.js';
import { TsTemplateFileExtractor } from './ts-template-file-extractor.js';

vi.mock('node:fs/promises');
vi.mock('node:fs');

beforeEach(() => {
  vol.reset();
  vi.clearAllMocks();
});

function createMockResolver(): ResolverFactory {
  return {
    async: vi.fn().mockImplementation((folder: string, source: string) =>
      Promise.resolve({
        path: source.startsWith('./')
          ? path.join(folder, source.slice(2))
          : source,
        error: null,
      }),
    ),
    sync: vi.fn(),
  } as unknown as ResolverFactory;
}

describe('TsTemplateFileExtractor', () => {
  it('should extract TS template file, replace variables, remove hoisted, and clean imports', async () => {
    const context =
      TemplateFileExtractorTestUtils.createTestTemplateFileExtractorContext();
    const mockResolver = createMockResolver();
    const extractor = new TsTemplateFileExtractor(context, {
      pathResolver: mockResolver,
    });

    const inputFilePath =
      TemplateFileExtractorTestUtils.outputPath('my-component.ts');
    const templatePath = 'my-component.ts'; // Relative path for metadata/output

    vol.fromJSON({
      [inputFilePath]: `
import { A, B, C, D } from 'external-package';
import { Z } from './unused-import.ts';

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
          fileOptions: { kind: 'singleton' },
        },
      },
      {
        path: TemplateFileExtractorTestUtils.outputPath('ignored.ts'),
        metadata: {
          name: 'ignored',
          type: TS_TEMPLATE_TYPE,
          generator: TemplateFileExtractorTestUtils.TEST_GENERATOR_NAME,
          template: templatePath,
          projectExportsOnly: true,
          fileOptions: { kind: 'singleton' },
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
      "// @ts-nocheck

      import { A, B } from 'external-package';

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
      "import { createTsTemplateFile } from '@baseplate-dev/core-generators';

      const myComponentTemplate = createTsTemplateFile({
        name: 'myComponentTemplate',
        projectExports: {},
        source: { path: 'my-component.ts' },
        variables: { TPL_COMPONENT_NAME: {}, TPL_MESSAGE: {}, TPL_PROP_VALUE: {} },
      });

      export const TEST_GENERATOR_TS_TEMPLATES = { myComponentTemplate };
      "
    `);
  }, 10_000);

  it('should generate import maps file for project exports', async () => {
    const context =
      TemplateFileExtractorTestUtils.createTestTemplateFileExtractorContext();
    const mockResolver = createMockResolver();
    const extractor = new TsTemplateFileExtractor(context, {
      pathResolver: mockResolver,
    });
    const inputFilePath = TemplateFileExtractorTestUtils.outputPath(
      'components/test-component.ts',
    );

    vol.fromJSON({
      [inputFilePath]: `
      export const TestComponent = () => {};
      export type TestComponentProps = {};
      export default TestDefaultExport = 'default';
      `,
    });

    await extractor.extractTemplateFiles([
      {
        path: inputFilePath,
        metadata: {
          type: TS_TEMPLATE_TYPE,
          name: 'testComponent',
          generator: 'test-package#test-generator',
          template: 'test-component.ts',
          projectExports: {
            TestComponent: { isTypeOnly: false },
            TestComponentProps: { isTypeOnly: true },
            TestDefaultExport: { exportName: 'default' },
          },
          fileOptions: { kind: 'singleton' },
        },
      },
    ]);

    const result = vol.toJSON();
    const generatedImportsPath =
      TemplateFileExtractorTestUtils.generatedPath('ts-import-maps.ts');

    // Check that the import maps file was generated
    expect(result[generatedImportsPath]).toBeDefined();
    expect(result[generatedImportsPath]).toContain(
      'testGeneratorImportsSchema',
    );
    expect(result[generatedImportsPath]).toContain(
      'TestGeneratorImportsProvider',
    );
    expect(result[generatedImportsPath]).toContain(
      'testGeneratorImportsProvider',
    );
    expect(result[generatedImportsPath]).toContain(
      'createTestGeneratorImports',
    );

    // Check that the exports are included
    expect(result[generatedImportsPath]).toContain('TestComponent: {}');
    expect(result[generatedImportsPath]).toContain(
      'TestComponentProps: { isTypeOnly: true }',
    );

    // Check the path mapping
    expect(result[generatedImportsPath]).toContain(
      "TestComponent: path.join(importBase, 'test-component.js')",
    );
    expect(result[generatedImportsPath]).toContain(
      "TestComponentProps: path.join(importBase, 'test-component.js')",
    );

    // Snapshot the imports file for detailed verification
    expect(result[generatedImportsPath]).toMatchInlineSnapshot(`
      "import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

      import {
        createTsImportMap,
        createTsImportMapSchema,
      } from '@baseplate-dev/core-generators';
      import { createReadOnlyProviderType } from '@baseplate-dev/sync';
      import path from 'node:path/posix';

      const testGeneratorImportsSchema = createTsImportMapSchema({
        TestComponent: {},
        TestComponentProps: { isTypeOnly: true },
        TestDefaultExport: { name: 'default' },
      });

      type TestGeneratorImportsProvider = TsImportMapProviderFromSchema<
        typeof testGeneratorImportsSchema
      >;

      export const testGeneratorImportsProvider =
        createReadOnlyProviderType<TestGeneratorImportsProvider>(
          'test-generator-imports',
        );

      export function createTestGeneratorImports(
        importBase: string,
      ): TestGeneratorImportsProvider {
        if (!importBase.startsWith('@/')) {
          throw new Error('importBase must start with @/');
        }

        return createTsImportMap(testGeneratorImportsSchema, {
          TestComponent: path.join(importBase, 'test-component.js'),
          TestComponentProps: path.join(importBase, 'test-component.js'),
          TestDefaultExport: path.join(importBase, 'test-component.js'),
        });
      }
      "
    `);
  });

  it('should handle import provider resolution across multiple generators', async () => {
    const context =
      TemplateFileExtractorTestUtils.createTestTemplateFileExtractorContext();
    const mockResolver = createMockResolver();
    const extractor = new TsTemplateFileExtractor(context, {
      pathResolver: mockResolver,
    });

    // Set up first generator files
    const firstGeneratorName =
      TemplateFileExtractorTestUtils.TEST_GENERATOR_NAME;
    const firstComponentPath = TemplateFileExtractorTestUtils.outputPath(
      'components/first-component.ts',
    );
    const firstUtilPath = TemplateFileExtractorTestUtils.outputPath(
      'components/first-util.ts',
    );

    vol.fromJSON({
      [firstComponentPath]: `
import { FirstUtil } from './first-util.ts';

export function FirstComponent() {
  return FirstUtil();
}
`,
      [firstUtilPath]: `
export function FirstUtil() {
  return 'first';
}
`,
    });

    // Set up second generator files
    const secondGeneratorName =
      TemplateFileExtractorTestUtils.TEST_GENERATOR_2_NAME;
    const secondComponentPath = TemplateFileExtractorTestUtils.outputPath(
      'components/second-component.ts',
    );
    const secondUtilPath = TemplateFileExtractorTestUtils.outputPath(
      'components/second-util.ts',
    );

    vol.fromJSON({
      [secondComponentPath]: `
import { SecondUtil } from './second-util.ts';
import { FirstComponent } from './first-component.ts';

export function SecondComponent() {
  return FirstComponent() + SecondUtil();
}
`,
      [secondUtilPath]: `
export function SecondUtil() {
  return 'second';
}
`,
    });

    // Extract files from both generators
    await extractor.extractTemplateFiles([
      {
        path: firstComponentPath,
        metadata: {
          type: TS_TEMPLATE_TYPE,
          name: 'firstComponent',
          generator: firstGeneratorName,
          template: 'first-component.ts',
          projectExports: {
            FirstComponent: { isTypeOnly: false },
          },
          fileOptions: { kind: 'singleton' },
        },
      },
      {
        path: firstUtilPath,
        metadata: {
          type: TS_TEMPLATE_TYPE,
          name: 'firstUtil',
          generator: firstGeneratorName,
          template: 'first-util.ts',
          projectExports: {
            FirstUtil: { isTypeOnly: false },
          },
          fileOptions: { kind: 'singleton' },
        },
      },
      {
        path: secondComponentPath,
        metadata: {
          type: TS_TEMPLATE_TYPE,
          name: 'secondComponent',
          generator: secondGeneratorName,
          template: 'second-component.ts',
          projectExports: {
            SecondComponent: { isTypeOnly: false },
          },
          fileOptions: { kind: 'singleton' },
        },
      },
      {
        path: secondUtilPath,
        metadata: {
          type: TS_TEMPLATE_TYPE,
          name: 'secondUtil',
          generator: secondGeneratorName,
          template: 'second-util.ts',
          projectExports: {
            SecondUtil: { isTypeOnly: false },
          },
          fileOptions: { kind: 'singleton' },
        },
      },
    ]);

    const result = vol.toJSON();
    const firstGeneratorImportsPath =
      TemplateFileExtractorTestUtils.generatedPath(
        'ts-import-maps.ts',
        firstGeneratorName,
      );
    const secondGeneratorImportsPath =
      TemplateFileExtractorTestUtils.generatedPath(
        'ts-import-maps.ts',
        secondGeneratorName,
      );

    // Check that import maps were generated for both generators
    expect(result[firstGeneratorImportsPath]).toBeDefined();
    expect(result[secondGeneratorImportsPath]).toBeDefined();

    // Check first generator imports
    expect(result[firstGeneratorImportsPath]).toContain('FirstComponent');
    expect(result[firstGeneratorImportsPath]).toContain('FirstUtil');

    // Check second generator imports
    expect(result[secondGeneratorImportsPath]).toContain('SecondComponent');
    expect(result[secondGeneratorImportsPath]).toContain('SecondUtil');

    expect(result[firstGeneratorImportsPath]).toMatchInlineSnapshot(`
      "import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

      import {
        createTsImportMap,
        createTsImportMapSchema,
      } from '@baseplate-dev/core-generators';
      import { createReadOnlyProviderType } from '@baseplate-dev/sync';
      import path from 'node:path/posix';

      const testGeneratorImportsSchema = createTsImportMapSchema({
        FirstComponent: {},
        FirstUtil: {},
      });

      type TestGeneratorImportsProvider = TsImportMapProviderFromSchema<
        typeof testGeneratorImportsSchema
      >;

      export const testGeneratorImportsProvider =
        createReadOnlyProviderType<TestGeneratorImportsProvider>(
          'test-generator-imports',
        );

      export function createTestGeneratorImports(
        importBase: string,
      ): TestGeneratorImportsProvider {
        if (!importBase.startsWith('@/')) {
          throw new Error('importBase must start with @/');
        }

        return createTsImportMap(testGeneratorImportsSchema, {
          FirstComponent: path.join(importBase, 'first-component.js'),
          FirstUtil: path.join(importBase, 'first-util.js'),
        });
      }
      "
    `);

    // Check that the generated template files have the correct imports
    const firstComponentTemplatePath =
      TemplateFileExtractorTestUtils.templatePath(
        'first-component.ts',
        firstGeneratorName,
      );
    const secondComponentTemplatePath =
      TemplateFileExtractorTestUtils.templatePath(
        'second-component.ts',
        secondGeneratorName,
      );

    expect(result[firstComponentTemplatePath]).toContain(
      "import { FirstUtil } from './first-util.js'",
    );
    expect(result[secondComponentTemplatePath]).toContain(
      "import { SecondUtil } from './second-util.js'",
    );
    expect(result[secondComponentTemplatePath]).toContain(
      "import { FirstComponent } from '%testGeneratorImports'",
    );

    expect(result[secondComponentTemplatePath]).toMatchInlineSnapshot(`
      "// @ts-nocheck

      import { FirstComponent } from '%testGeneratorImports';

      import { SecondUtil } from './second-util.js';

      export function SecondComponent() {
        return FirstComponent() + SecondUtil();
      }
      "
    `);

    // Check that the template definitions are correct
    const firstGeneratorTemplatesPath =
      TemplateFileExtractorTestUtils.generatedPath(
        'ts-templates.ts',
        firstGeneratorName,
      );
    const secondGeneratorTemplatesPath =
      TemplateFileExtractorTestUtils.generatedPath(
        'ts-templates.ts',
        secondGeneratorName,
      );

    expect(result[firstGeneratorTemplatesPath]).toContain('firstComponent');
    expect(result[firstGeneratorTemplatesPath]).toContain('firstUtil');
    expect(result[secondGeneratorTemplatesPath]).toContain('secondComponent');
    expect(result[secondGeneratorTemplatesPath]).toContain('secondUtil');
  });

  it('should handle project export groups correctly', async () => {
    const context =
      TemplateFileExtractorTestUtils.createTestTemplateFileExtractorContext();
    const mockResolver = createMockResolver();
    const extractor = new TsTemplateFileExtractor(context, {
      pathResolver: mockResolver,
    });

    // Set up files with different export groups
    const componentPath = TemplateFileExtractorTestUtils.outputPath(
      'components/grouped-component.ts',
    );
    const utilPath = TemplateFileExtractorTestUtils.outputPath(
      'components/grouped-util.ts',
    );

    vol.fromJSON({
      [componentPath]: `
export function GroupedComponent() {
  return 'component';
}
`,
      [utilPath]: `
export function GroupedUtil() {
  return 'util';
}
`,
    });

    // Extract files with different export groups
    await extractor.extractTemplateFiles([
      {
        path: componentPath,
        metadata: {
          type: TS_TEMPLATE_TYPE,
          name: 'groupedComponent',
          generator: TemplateFileExtractorTestUtils.TEST_GENERATOR_NAME,
          template: 'grouped-component.ts',
          projectExports: {
            GroupedComponent: { isTypeOnly: false },
          },
          exportGroup: 'components',
          fileOptions: { kind: 'singleton' },
        },
      },
      {
        path: utilPath,
        metadata: {
          type: TS_TEMPLATE_TYPE,
          name: 'groupedUtil',
          generator: TemplateFileExtractorTestUtils.TEST_GENERATOR_NAME,
          template: 'grouped-util.ts',
          projectExports: {
            GroupedUtil: { isTypeOnly: false },
          },
          exportGroup: 'utils',
          fileOptions: { kind: 'singleton' },
        },
      },
    ]);

    const result = vol.toJSON();
    const generatedImportsPath =
      TemplateFileExtractorTestUtils.generatedPath('ts-import-maps.ts');

    // Check that the import maps file was generated with both export groups
    expect(result[generatedImportsPath]).toBeDefined();
    expect(result[generatedImportsPath]).toContain('componentsImportsSchema');
    expect(result[generatedImportsPath]).toContain('utilsImportsSchema');
    expect(result[generatedImportsPath]).toContain('GroupedComponent');
    expect(result[generatedImportsPath]).toContain('GroupedUtil');

    // Check that the exports are in their respective groups
    expect(result[generatedImportsPath]).toContain(
      "GroupedComponent: path.join(importBase, 'grouped-component.js')",
    );
    expect(result[generatedImportsPath]).toContain(
      "GroupedUtil: path.join(importBase, 'grouped-util.js')",
    );

    // Snapshot the imports file for detailed verification
    expect(result[generatedImportsPath]).toMatchInlineSnapshot(`
      "import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

      import {
        createTsImportMap,
        createTsImportMapSchema,
      } from '@baseplate-dev/core-generators';
      import { createReadOnlyProviderType } from '@baseplate-dev/sync';
      import path from 'node:path/posix';

      const componentsImportsSchema = createTsImportMapSchema({
        GroupedComponent: {},
      });

      type ComponentsImportsProvider = TsImportMapProviderFromSchema<
        typeof componentsImportsSchema
      >;

      export const componentsImportsProvider =
        createReadOnlyProviderType<ComponentsImportsProvider>('components-imports');

      export function createComponentsImports(
        importBase: string,
      ): ComponentsImportsProvider {
        if (!importBase.startsWith('@/')) {
          throw new Error('importBase must start with @/');
        }

        return createTsImportMap(componentsImportsSchema, {
          GroupedComponent: path.join(importBase, 'grouped-component.js'),
        });
      }

      const utilsImportsSchema = createTsImportMapSchema({ GroupedUtil: {} });

      type UtilsImportsProvider = TsImportMapProviderFromSchema<
        typeof utilsImportsSchema
      >;

      export const utilsImportsProvider =
        createReadOnlyProviderType<UtilsImportsProvider>('utils-imports');

      export function createUtilsImports(importBase: string): UtilsImportsProvider {
        if (!importBase.startsWith('@/')) {
          throw new Error('importBase must start with @/');
        }

        return createTsImportMap(utilsImportsSchema, {
          GroupedUtil: path.join(importBase, 'grouped-util.js'),
        });
      }
      "
    `);
  });

  it('should handle export groups with generator options', async () => {
    const context =
      TemplateFileExtractorTestUtils.createTestTemplateFileExtractorContext();
    const mockResolver = createMockResolver();
    const extractor = new TsTemplateFileExtractor(context, {
      pathResolver: mockResolver,
    });

    // Set up files with different export groups
    const componentPath = TemplateFileExtractorTestUtils.outputPath(
      'components/grouped-component.ts',
    );
    const utilPath = TemplateFileExtractorTestUtils.outputPath(
      'components/grouped-util.ts',
    );

    // Mock the generator options file
    const generatorOptionsPath = path.join(
      TemplateFileExtractorTestUtils.TEST_GENERATOR_BASE_DIRECTORY,
      'ts-extractor.json',
    );

    vol.fromJSON({
      [componentPath]: `
export function GroupedComponent() {
  return 'component';
}
`,
      [utilPath]: `
export function GroupedUtil() {
  return 'util';
}
`,
      [generatorOptionsPath]: JSON.stringify({
        exportGroups: {
          components: {
            exportProviderType: true,
          },
          utils: {
            exportProviderType: false,
          },
        },
      }),
    });

    // Extract files with different export groups
    await extractor.extractTemplateFiles([
      {
        path: componentPath,
        metadata: {
          type: TS_TEMPLATE_TYPE,
          name: 'groupedComponent',
          generator: TemplateFileExtractorTestUtils.TEST_GENERATOR_NAME,
          template: 'grouped-component.ts',
          projectExports: {
            GroupedComponent: { isTypeOnly: false },
          },
          exportGroup: 'components',
          fileOptions: { kind: 'singleton' },
        },
      },
      {
        path: utilPath,
        metadata: {
          type: TS_TEMPLATE_TYPE,
          name: 'groupedUtil',
          generator: TemplateFileExtractorTestUtils.TEST_GENERATOR_NAME,
          template: 'grouped-util.ts',
          projectExports: {
            GroupedUtil: { isTypeOnly: false },
          },
          exportGroup: 'utils',
          fileOptions: { kind: 'singleton' },
        },
      },
    ]);

    const result = vol.toJSON();
    const generatedImportsPath =
      TemplateFileExtractorTestUtils.generatedPath('ts-import-maps.ts');

    // Check that the import maps file was generated with both export groups
    expect(result[generatedImportsPath]).toBeDefined();
    expect(result[generatedImportsPath]).toContain('componentsImportsSchema');
    expect(result[generatedImportsPath]).toContain('utilsImportsSchema');
    expect(result[generatedImportsPath]).toContain('GroupedComponent');
    expect(result[generatedImportsPath]).toContain('GroupedUtil');

    // Check that the exports are in their respective groups
    expect(result[generatedImportsPath]).toContain(
      "GroupedComponent: path.join(importBase, 'grouped-component.js')",
    );
    expect(result[generatedImportsPath]).toContain(
      "GroupedUtil: path.join(importBase, 'grouped-util.js')",
    );

    // Check that the provider types are exported correctly based on options
    expect(result[generatedImportsPath]).toContain(
      'export type ComponentsImportsProvider',
    );
    expect(result[generatedImportsPath]).not.toContain(
      'export type UtilsImportsProvider',
    );
  });
});
