import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  mergeBarrelExports,
  templateExtractorBarrelExportPlugin,
} from './barrel-export.js';
import { vol } from 'memfs';
import {
  addMockExtractorConfig,
  createMockContext,
  createPluginInstance,
} from '@baseplate-dev/sync/extractor-v2/test-utils';

vi.mock('node:fs');
vi.mock('node:fs/promises');

beforeEach(() => {
  vol.reset();
});

describe('mergeBarrelExports', () => {
  it('should merge and sort exports', () => {
    // Arrange
    const indexFileContents = `
export { foo } from './foo';
export { bar } from './bar';
export * from './baz';
`;

    const barrelExports = [
      { moduleSpecifier: './bar', namedExports: ['qux', 'quux'] },
      { moduleSpecifier: './foo', namedExports: ['baz'] },
      { moduleSpecifier: './baz', namedExports: ['*'] },
    ];

    // Act
    const result = mergeBarrelExports(indexFileContents, barrelExports);

    // Assert
    expect(result).toMatchInlineSnapshot(`
      "export { quux, qux } from './bar';
      export * from './baz';
      export { baz } from './foo';
      "
    `);
  });

  it('should handle empty exports', () => {
    // Arrange
    const indexFileContents = '';
    const barrelExports: { moduleSpecifier: string; namedExports: string[] }[] =
      [];

    // Act
    const result = mergeBarrelExports(indexFileContents, barrelExports);

    // Assert
    expect(result).toBe('');
  });
});

describe('templateExtractorBarrelExportPlugin', () => {
  it('should create plugin instance and add barrel exports', async () => {
    // Arrange
    const context = await createMockContext({
      outputDirectory: '/test-output',
      packageMap: new Map([['test-package', '/test-generator']]),
    });

    addMockExtractorConfig(context, 'test-package#test-generator', {
      name: 'test-generator',
      generatorDirectory: '/test-generator',
    });

    // Act
    const { instance, executeHooks } = await createPluginInstance(
      templateExtractorBarrelExportPlugin,
      context,
    );

    // Add some barrel exports
    instance.addBarrelExport('test-package#test-generator', {
      moduleSpecifier: './utils',
      namedExports: ['helper1', 'helper2'],
    });

    instance.addBarrelExport('test-package#test-generator', {
      moduleSpecifier: './components',
      namedExports: ['*'],
    });

    // Execute the afterWrite hook
    await executeHooks('afterWrite');

    // Assert - check the file container instead of memfs
    const files = context.fileContainer.getFiles();
    const indexPath = '/test-generator/index.ts';
    expect(files.has(indexPath)).toBe(true);

    const indexContent = files.get(indexPath) as string;
    expect(indexContent).toContain("export * from './components'");
    expect(indexContent).toContain(
      "export { helper1, helper2 } from './utils'",
    );
    expect(indexContent).toContain(
      "export * from './test-generator.generator.js'",
    );
  });
});
