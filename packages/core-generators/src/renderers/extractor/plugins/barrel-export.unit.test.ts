import {
  addMockExtractorConfig,
  createMockContext,
  createPluginInstance,
} from '@baseplate-dev/sync/extractor-test-utils';
import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TemplateExtractorGeneratedBarrelExport } from './barrel-export.js';

import {
  mergeBarrelExports,
  mergeGeneratedBarrelExports,
  templateExtractorBarrelExportPlugin,
} from './barrel-export.js';

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
      "export { bar, quux, qux } from './bar';
      export * from './baz';
      export { baz, foo } from './foo';
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

  it('should merge existing exports with new exports', () => {
    // Arrange
    const indexFileContents = `
export { foo } from './foo';
export { bar } from './bar';
export type { SomeType } from './types';
`;

    const barrelExports = [
      { moduleSpecifier: './bar', namedExports: ['qux'] },
      { moduleSpecifier: './new-module', namedExports: ['newExport'] },
    ];

    // Act
    const result = mergeBarrelExports(indexFileContents, barrelExports);

    // Assert
    // Should include both old and new exports
    expect(result).toContain("export { bar, qux } from './bar';");
    expect(result).toContain("export { foo } from './foo';");
    expect(result).toContain("export { newExport } from './new-module';");
    expect(result).toContain("export type { SomeType } from './types';");
  });

  it('should handle duplicate exports by keeping both', () => {
    // Arrange
    const indexFileContents = `
export { foo, bar } from './module';
`;

    const barrelExports = [
      { moduleSpecifier: './module', namedExports: ['baz', 'bar'] },
    ];

    // Act
    const result = mergeBarrelExports(indexFileContents, barrelExports);

    // Assert
    // Should merge named exports from same module
    expect(result).toContain("export { bar, baz, foo } from './module';");
  });
});

describe('mergeGeneratedBarrelExports', () => {
  it('should create generated barrel export with constant name', () => {
    // Arrange
    const generatorName = 'test-package#error-handler-service';
    const indexFileContents = '';
    const generatedBarrelExports = [
      {
        moduleSpecifier: './services/error-handler.service',
        namedExport: 'ErrorHandlerService',
        name: 'errorHandlerService',
      },
      {
        moduleSpecifier: './constants/error-codes',
        namedExport: 'ERROR_CODES',
        name: 'errorCodes',
      },
    ];

    // Act
    const result = mergeGeneratedBarrelExports(
      generatorName,
      indexFileContents,
      generatedBarrelExports,
    );

    // Assert
    expect(result).toContain(
      "import { ErrorHandlerService } from './services/error-handler.service';",
    );
    expect(result).toContain(
      "import { ERROR_CODES } from './constants/error-codes';",
    );
    expect(result).toContain(
      'export const ERROR_HANDLER_SERVICE_GENERATED = {',
    );
    expect(result).toContain('errorCodes: ERROR_CODES,');
    expect(result).toContain('errorHandlerService: ErrorHandlerService,');
  });

  it('should handle empty generated barrel exports', () => {
    // Arrange
    const generatorName = 'test-package#test-generator';
    const indexFileContents = '';
    const generatedBarrelExports: TemplateExtractorGeneratedBarrelExport[] = [];

    // Act
    const result = mergeGeneratedBarrelExports(
      generatorName,
      indexFileContents,
      generatedBarrelExports,
    );

    // Assert
    expect(result).toBe('');
  });

  it('should group imports by module specifier', () => {
    // Arrange
    const generatorName = 'test-package#test-generator';
    const indexFileContents = '';
    const generatedBarrelExports = [
      {
        moduleSpecifier: './services/user.service',
        namedExport: 'UserService',
        name: 'userService',
      },
      {
        moduleSpecifier: './services/user.service',
        namedExport: 'UserConstants',
        name: 'userConstants',
      },
      {
        moduleSpecifier: './utils/helpers',
        namedExport: 'formatUser',
        name: 'formatUser',
      },
    ];

    // Act
    const result = mergeGeneratedBarrelExports(
      generatorName,
      indexFileContents,
      generatedBarrelExports,
    );

    // Assert
    expect(result).toContain(
      "import { UserConstants, UserService } from './services/user.service';",
    );
    expect(result).toContain("import { formatUser } from './utils/helpers';");
    expect(result).toContain('formatUser: formatUser,');
    expect(result).toContain('userConstants: UserConstants,');
    expect(result).toContain('userService: UserService,');
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

  it('should create plugin instance and add generated barrel exports', async () => {
    // Arrange
    const context = await createMockContext({
      outputDirectory: '/test-output',
      packageMap: new Map([['test-package', '/test-generator']]),
    });

    addMockExtractorConfig(context, 'test-package#error-handler-service', {
      name: 'error-handler-service',
      generatorDirectory: '/test-generator',
    });

    // Act
    const { instance, executeHooks } = await createPluginInstance(
      templateExtractorBarrelExportPlugin,
      context,
    );

    // Add some generated barrel exports
    instance.addGeneratedBarrelExport('test-package#error-handler-service', {
      moduleSpecifier: './services/error-handler.service',
      namedExport: 'ErrorHandlerService',
      name: 'errorHandlerService',
    });

    instance.addGeneratedBarrelExport('test-package#error-handler-service', {
      moduleSpecifier: './constants/error-codes',
      namedExport: 'ERROR_CODES',
      name: 'errorCodes',
    });

    // Execute the afterWrite hook
    await executeHooks('afterWrite');

    // Assert - check the file container for generated/index.ts
    const files = context.fileContainer.getFiles();
    const generatedIndexPath = '/test-generator/generated/index.ts';
    expect(files.has(generatedIndexPath)).toBe(true);

    const generatedIndexContent = files.get(generatedIndexPath) as string;
    expect(generatedIndexContent).toContain(
      "import { ErrorHandlerService } from './services/error-handler.service';",
    );
    expect(generatedIndexContent).toContain(
      "import { ERROR_CODES } from './constants/error-codes';",
    );
    expect(generatedIndexContent).toContain(
      'export const ERROR_HANDLER_SERVICE_GENERATED = {',
    );
    expect(generatedIndexContent).toContain('errorCodes: ERROR_CODES,');
    expect(generatedIndexContent).toContain(
      'errorHandlerService: ErrorHandlerService,',
    );
  });

  it('should handle both regular and generated barrel exports', async () => {
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

    // Add regular barrel export
    instance.addBarrelExport('test-package#test-generator', {
      moduleSpecifier: './utils',
      namedExports: ['helper1'],
    });

    // Add generated barrel export
    instance.addGeneratedBarrelExport('test-package#test-generator', {
      moduleSpecifier: './services/test.service',
      namedExport: 'TestService',
      name: 'testService',
    });

    // Execute the afterWrite hook
    await executeHooks('afterWrite');

    // Assert - both files should exist
    const files = context.fileContainer.getFiles();

    // Regular barrel export should be in index.ts
    const indexPath = '/test-generator/index.ts';
    expect(files.has(indexPath)).toBe(true);
    const indexContent = files.get(indexPath) as string;
    expect(indexContent).toContain("export { helper1 } from './utils'");

    // Generated barrel export should be in generated/index.ts
    const generatedIndexPath = '/test-generator/generated/index.ts';
    expect(files.has(generatedIndexPath)).toBe(true);
    const generatedIndexContent = files.get(generatedIndexPath) as string;
    expect(generatedIndexContent).toContain(
      'export const TEST_GENERATOR_GENERATED = {',
    );
    expect(generatedIndexContent).toContain('testService: TestService,');
  });
});
