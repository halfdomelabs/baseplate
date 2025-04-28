import type { ResolverFactory } from 'oxc-resolver';

import { beforeEach, describe, expect, it, vi } from 'vitest';

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
      projectRoot: '/project-root',
      generatorFiles: ['/project-root/test.ts'],
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

    const sharedExportData = {
      importSource: '%testImports',
      providerImportName: 'testImportsProvider',
      providerPath: '/generator-root/generated/imports.ts',
      providerPackage: 'test-package',
    };

    const projectExportA = {
      name: 'A',
      filePath: '/project-root/module1.ts',
      isTypeOnly: false,
      ...sharedExportData,
    };
    const projectExportB = {
      name: 'B',
      filePath: '/project-root/module1.ts',
      isTypeOnly: false,
      ...sharedExportData,
    };
    const projectExportC = {
      name: 'F',
      filePath: '/project-root/default-module.ts',
      isTypeOnly: false,
      exportName: 'default',
      ...sharedExportData,
    };

    const projectExportMap = new Map([
      [
        '/project-root/module1.ts',
        new Map([
          ['A', projectExportA],
          ['B', projectExportB],
        ]),
      ],
      [
        '/project-root/default-module.ts',
        new Map([['default', projectExportC]]),
      ],
    ]);

    const context = {
      projectExportMap,
      projectRoot: '/project-root',
      generatorFiles: ['/project-root/module2.ts'],
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
      projectRoot: '/project-root',
      generatorFiles: [],
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
      projectRoot: '/project-root',
      generatorFiles: [],
      resolver: mockResolver,
    };

    await expect(
      organizeTsTemplateImports(filePath, contents, context),
    ).rejects.toThrow('is not found in the project exports');
  });
});
