import type { ResolverFactory } from 'oxc-resolver';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TsProjectExport } from './build-ts-project-export-map.js';

import { organizeTsTemplateImports } from './organize-ts-template-imports.js';

function createMockResolver(): ResolverFactory {
  return {
    async: vi
      .fn()
      .mockImplementation((filePath: string, moduleSpecifier: string) => ({
        path: moduleSpecifier.startsWith('./')
          ? `/project-root/${moduleSpecifier.slice(2)}`
          : moduleSpecifier,
        error: null,
      })),
    sync: vi.fn(),
  } as unknown as ResolverFactory;
}

function createProjectExport(
  tsProjectExport: Partial<TsProjectExport> &
    Pick<TsProjectExport, 'name' | 'outputRelativePath'>,
): TsProjectExport {
  return {
    placeholderModuleSpecifier: '%testImports',
    providerPackagePathSpecifier: 'test-package:test-imports',
    providerImportName: 'testImportsProvider',
    ...tsProjectExport,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('organizeTsTemplateImports', () => {
  it('should organize imports for files without any imports', async () => {
    const mockResolver = createMockResolver();
    const filePath = '/project-root/test.ts';
    const contents = `
/*
 * Capitalizes the first letter of a string.
 *
 * @param str - The string to capitalize.
 * @returns The capitalized string.
 */
export function capitalizeString(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
`;

    const context = {
      projectExportMap: new Map(),
      outputDirectory: '/project-root',
      internalOutputRelativePaths: ['/project-root/test.ts'],
      resolver: mockResolver,
    };

    const result = await organizeTsTemplateImports(filePath, contents, context);

    // Check that the output contains the organized imports
    expect(result.contents).toEqual(contents);
  });

  it('should preserve client directives', async () => {
    const mockResolver = createMockResolver();
    const filePath = '/project-root/test.ts';
    const contents = `"use client";

import { A } from "test";



export function capitalizeString(str: string) {
    A();
}
`;

    const context = {
      projectExportMap: new Map(),
      outputDirectory: '/project-root',
      internalOutputRelativePaths: ['/project-root/test.ts'],
      resolver: mockResolver,
    };

    const result = await organizeTsTemplateImports(filePath, contents, context);

    // Check that the output contains the organized imports
    expect(result.contents).toEqual(contents);
  });

  it('should not hoist comments', async () => {
    const mockResolver = createMockResolver();
    const filePath = '/project-root/test.ts';
    const contents = `import { A } from "test";

/**
 * Capitalizes the first letter of a string.
 */
export function capitalizeString(str: string) {
    A();
}
`;

    const context = {
      projectExportMap: new Map(),
      outputDirectory: '/project-root',
      internalOutputRelativePaths: ['/project-root/test.ts'],
      resolver: mockResolver,
    };

    const result = await organizeTsTemplateImports(filePath, contents, context);

    // Check that the output contains the organized imports
    expect(result.contents).toEqual(contents);
  });

  it('should organize imports and return used project exports', async () => {
    const mockResolver = createMockResolver();
    const filePath = '/project-root/test.ts';
    const contents = `
import { A, B } from './module1.ts';
import { C } from './module2.ts';
import { D } from 'external-package';
import { E } from 'unused-package';
import F from './default-module.ts';

export function test() {
  const a = new A();
  const b = B();
  const c = C();
  const d = D();
  const f = F();
  return a + b + c + d + f;
}
`;

    const projectExportA = createProjectExport({
      name: 'A',
      outputRelativePath: 'module1.ts',
    });
    const projectExportB = createProjectExport({
      name: 'B',
      outputRelativePath: 'module1.ts',
    });
    const projectExportC = createProjectExport({
      name: 'F',
      outputRelativePath: 'default-module.ts',
      exportedName: 'default',
    });

    const projectExportMap = new Map([
      [
        'module1.ts',
        new Map([
          ['A', projectExportA],
          ['B', projectExportB],
        ]),
      ],
      ['default-module.ts', new Map([['default', projectExportC]])],
    ]);

    const context = {
      projectExportMap,
      outputDirectory: '/project-root',
      internalOutputRelativePaths: ['module2.ts'],
      resolver: mockResolver,
    };

    const result = await organizeTsTemplateImports(filePath, contents, context);

    // Check that the output contains the organized imports
    expect(result.contents).toContain('import { A, B, F } from "%testImports"');
    expect(result.contents).toContain('import { C } from "./module2.js"');
    expect(result.contents).toContain('import { D } from "external-package"');

    // Check that unused imports are removed
    expect(result.contents).not.toContain('unused-package');

    // Check that the used project exports are returned
    expect(result.usedProjectExports).toHaveLength(3);
    expect(result.usedProjectExports[0]).toBe(projectExportA);
    expect(result.usedProjectExports[1]).toBe(projectExportB);
    expect(result.usedProjectExports[2]).toBe(projectExportC);
  });

  it('should throw error for namespace imports', async () => {
    const mockResolver = createMockResolver();
    const filePath = '/project-root/test.ts';
    const contents = `
import * as Module from './module1';

Module.A;
`;

    const context = {
      projectExportMap: new Map(),
      outputDirectory: '/project-root',
      internalOutputRelativePaths: [],
      resolver: mockResolver,
    };

    await expect(
      organizeTsTemplateImports(filePath, contents, context),
    ).rejects.toThrow('cannot be a namespace import');
  });

  it('should throw error for missing project exports', async () => {
    const mockResolver = createMockResolver();
    const filePath = '/project-root/test.ts';
    const contents = `
import { A } from './module1';

console.log(A);
`;

    const context = {
      projectExportMap: new Map(),
      outputDirectory: '/project-root',
      internalOutputRelativePaths: [],
      resolver: mockResolver,
    };

    await expect(
      organizeTsTemplateImports(filePath, contents, context),
    ).rejects.toThrow('is not found in the project exports');
  });
});
