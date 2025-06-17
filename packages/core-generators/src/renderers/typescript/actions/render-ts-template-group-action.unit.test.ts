import { createProviderType, testAction } from '@baseplate-dev/sync';
import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { tsCodeFragment } from '../fragments/creators.js';
import {
  createTsImportMap,
  createTsImportMapSchema,
} from '../import-maps/ts-import-map.js';
import { createTsTemplateFile, TS_TEMPLATE_TYPE } from '../templates/types.js';
import { renderTsTemplateGroupAction } from './render-ts-template-group-action.js';

vi.mock('fs');
vi.mock('fs/promises');

beforeEach(() => {
  vol.reset();
});

describe('renderTsTemplateGroupAction', () => {
  it('should render multiple template files from a group', async () => {
    // Arrange
    vol.fromJSON({
      '/root/pkg/test-generator/templates/greeting.ts':
        'const greeting = TPL_GREETING;',
      '/root/pkg/test-generator/templates/name.ts': 'const name = TPL_NAME;',
    });

    const action = renderTsTemplateGroupAction({
      group: {
        greeting: createTsTemplateFile({
          name: 'greeting',
          source: { path: 'greeting.ts' },
          variables: {
            TPL_GREETING: { description: 'The greeting to use' },
          },
        }),
        name: createTsTemplateFile({
          name: 'name',
          source: { path: 'name.ts' },
          variables: {
            TPL_NAME: { description: 'The name to use' },
          },
        }),
      },
      paths: {
        greeting: 'output/greeting.ts',
        name: 'output/name.ts',
      },
      variables: {
        greeting: {
          TPL_GREETING: tsCodeFragment('"Hello"'),
        },
        name: {
          TPL_NAME: tsCodeFragment('"World"'),
        },
      },
    });

    // Act
    const output = await testAction(action, {
      generatorInfo: {
        name: 'test-generator',
        baseDirectory: '/root/pkg/test-generator',
      },
      templateMetadataOptions: {
        includeTemplateMetadata: true,
        shouldGenerateMetadata: () => true,
      },
    });

    // Assert
    expect(output.files.size).toBe(2);

    const greetingFile = output.files.get('output/greeting.ts');
    expect(greetingFile?.id).toBe('test-generator:greeting');
    expect(greetingFile?.contents).toEqual(
      'const greeting = /* TPL_GREETING:START */ "Hello" /* TPL_GREETING:END */;',
    );
    expect(greetingFile?.options?.templateMetadata).toEqual({
      name: 'greeting',
      template: 'greeting.ts',
      generator: 'test-generator',
      type: TS_TEMPLATE_TYPE,
    });

    const nameFile = output.files.get('output/name.ts');
    expect(nameFile?.id).toBe('test-generator:name');
    expect(nameFile?.contents).toEqual(
      'const name = /* TPL_NAME:START */ "World" /* TPL_NAME:END */;',
    );
    expect(nameFile?.options?.templateMetadata).toEqual({
      name: 'name',
      template: 'name.ts',
      generator: 'test-generator',
      type: TS_TEMPLATE_TYPE,
    });
  });

  it('should handle templates with import map providers', async () => {
    // Arrange
    const importMapSchema = createTsImportMapSchema({
      TestClass: { name: 'TestClass' },
    });

    const importMap = createTsImportMap(importMapSchema, {
      TestClass: 'test-package',
    });

    const action = renderTsTemplateGroupAction({
      group: {
        test: createTsTemplateFile({
          name: 'test',
          source: {
            contents: `
              import { TestClass } from "%testImport";
              const instance = new TestClass();
            `,
          },
          variables: {},
          importMapProviders: {
            testImport: createProviderType('test-import'),
          },
        }),
      },
      paths: {
        test: 'output/test.ts',
      },
      importMapProviders: {
        testImport: importMap,
      },
    });

    // Act
    const output = await testAction(action);

    // Assert
    expect(output.files.size).toBe(1);
    const file = output.files.get('output/test.ts');
    expect(file?.id).toBe('test-generator:test');
    expect(file?.contents).toContain(
      'import { TestClass } from "test-package"',
    );
    expect(file?.contents).toContain('const instance = new TestClass();');
  });

  it('should handle templates with content-only source', async () => {
    // Arrange
    const action = renderTsTemplateGroupAction({
      group: {
        content: createTsTemplateFile({
          name: 'content',
          source: {
            contents: 'const content = "static content";',
          },
          variables: {},
        }),
      },
      paths: {
        content: 'output/content.ts',
      },
    });

    // Act
    const output = await testAction(action);

    // Assert
    expect(output.files.size).toBe(1);
    const file = output.files.get('output/content.ts');
    expect(file?.id).toBe('test-generator:content');
    expect(file?.contents).toEqual('const content = "static content";');
  });

  it('should apply custom write options to specific templates', async () => {
    // Arrange
    vol.fromJSON({
      '/root/pkg/test-generator/templates/test.ts': 'const test = "value";',
    });

    const action = renderTsTemplateGroupAction({
      group: {
        test: createTsTemplateFile({
          name: 'test',
          source: { path: 'test.ts' },
          variables: {},
        }),
      },
      paths: {
        test: 'output/test.ts',
      },
      writeOptions: {
        test: {
          skipFormatting: true,
        },
      },
    });

    // Act
    const output = await testAction(action, {
      generatorInfo: {
        name: 'test-generator',
        baseDirectory: '/root/pkg/test-generator',
      },
    });

    // Assert
    expect(output.files.size).toBe(1);
    const file = output.files.get('output/test.ts');
    expect(file?.options?.skipFormatting).toBe(true);
  });

  it('should apply custom render options with resolveModule function', async () => {
    // Arrange
    const action = renderTsTemplateGroupAction({
      group: {
        test: createTsTemplateFile({
          name: 'test',
          source: {
            contents: 'import { Test } from "./relative";',
          },
          variables: {},
        }),
      },
      paths: {
        test: 'output/nested/test.ts',
      },
      renderOptions: {
        resolveModule: (specifier) => {
          if (specifier === './relative') {
            return '../relative';
          }
          return specifier;
        },
      },
    });

    // Act
    const output = await testAction(action);

    // Assert
    expect(output.files.size).toBe(1);
    const file = output.files.get('output/nested/test.ts');
    expect(file?.contents).toContain('import { Test } from "../relative"');
  });

  it('should handle templates without variables', async () => {
    // Arrange
    const action = renderTsTemplateGroupAction({
      group: {
        static: createTsTemplateFile({
          name: 'static',
          source: {
            contents: 'const staticValue = "unchanged";',
          },
          variables: {},
        }),
      },
      paths: {
        static: 'output/static.ts',
      },
    });

    // Act
    const output = await testAction(action);

    // Assert
    expect(output.files.size).toBe(1);
    const file = output.files.get('output/static.ts');
    expect(file?.contents).toEqual('const staticValue = "unchanged";');
  });

  it('should handle mixed template types in a group', async () => {
    // Arrange
    vol.fromJSON({
      '/root/pkg/test-generator/templates/file.ts': 'const fromFile = "file";',
    });

    const action = renderTsTemplateGroupAction({
      group: {
        file: createTsTemplateFile({
          name: 'file',
          source: { path: 'file.ts' },
          variables: {},
        }),
        content: createTsTemplateFile({
          name: 'content',
          source: {
            contents: 'const fromContent = "content";',
          },
          variables: {},
        }),
        withVariables: createTsTemplateFile({
          name: 'withVariables',
          source: {
            contents: 'const value = TPL_VALUE;',
          },
          variables: {
            TPL_VALUE: { description: 'A value' },
          },
        }),
      },
      paths: {
        file: 'output/file.ts',
        content: 'output/content.ts',
        withVariables: 'output/with-variables.ts',
      },
      variables: {
        withVariables: {
          TPL_VALUE: tsCodeFragment('"dynamic"'),
        },
      },
    });

    // Act
    const output = await testAction(action, {
      generatorInfo: {
        name: 'test-generator',
        baseDirectory: '/root/pkg/test-generator',
      },
      templateMetadataOptions: {
        includeTemplateMetadata: true,
        shouldGenerateMetadata: () => true,
      },
    });

    // Assert
    expect(output.files.size).toBe(3);

    expect(output.files.get('output/file.ts')?.contents).toEqual(
      'const fromFile = "file";',
    );
    expect(output.files.get('output/content.ts')?.contents).toEqual(
      'const fromContent = "content";',
    );
    expect(output.files.get('output/with-variables.ts')?.contents).toEqual(
      'const value = /* TPL_VALUE:START */ "dynamic" /* TPL_VALUE:END */;',
    );
  });
});
