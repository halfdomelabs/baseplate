import type { ResolverFactory } from 'oxc-resolver';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DeclaredPackageImportMap } from './build-declared-package-imports-map.js';
import type { TsProjectExport } from './build-ts-project-export-map.js';
import type { TsTemplateImportLookupContext } from './organize-ts-template-imports.js';

import { extractTsTemplateVariables } from './extract-ts-template-variables.js';
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
      workspacePackageDirectories: [],
      declaredPackageImportMap: new Map(),
      internalOutputRelativePaths: new Map([['/project-root/test.ts', 'test']]),
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
      workspacePackageDirectories: [],
      declaredPackageImportMap: new Map(),
      internalOutputRelativePaths: new Map([['/project-root/test.ts', 'test']]),
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
      workspacePackageDirectories: [],
      declaredPackageImportMap: new Map(),
      internalOutputRelativePaths: new Map([['/project-root/test.ts', 'test']]),
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
      workspacePackageDirectories: [],
      declaredPackageImportMap: new Map(),
      internalOutputRelativePaths: new Map([['module2.ts', 'module2']]),
      resolver: mockResolver,
    };

    const result = await organizeTsTemplateImports(filePath, contents, context);

    // Check that the output contains the organized imports
    expect(result.contents).toContain('import { A, B, F } from "%testImports"');
    expect(result.contents).toContain('import { C } from "$module2"');
    expect(result.contents).toContain('import { D } from "external-package"');

    // Check that unused imports are removed
    expect(result.contents).not.toContain('unused-package');

    // Check that the used project exports are returned
    expect(result.usedProjectExports).toHaveLength(3);
    expect(result.usedProjectExports[0]).toBe(projectExportA);
    expect(result.usedProjectExports[1]).toBe(projectExportB);
    expect(result.usedProjectExports[2]).toBe(projectExportC);

    // Check that the used generator files are returned
    expect(result.referencedGeneratorTemplates.size).toBe(1);
    expect(result.referencedGeneratorTemplates.has('module2')).toBe(true);
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
      workspacePackageDirectories: [],
      declaredPackageImportMap: new Map(),
      internalOutputRelativePaths: new Map(),
      resolver: mockResolver,
    };

    await expect(
      organizeTsTemplateImports(filePath, contents, context),
    ).rejects.toThrow('cannot be a namespace import');
  });

  it('should throw for an undeclared literal import into a sibling workspace package', async () => {
    // Regression test: a scoped import can resolve outside outputDirectory
    // entirely (e.g. into a sibling `libs/*` package of the same example
    // project) rather than into node_modules. Unless a generator declared the
    // package via registerPackageImportProvider, that case must still be
    // flagged rather than treated as an ordinary external package import.
    const mockResolver = {
      async: vi
        .fn()
        .mockImplementation((_filePath: string, moduleSpecifier: string) => ({
          path:
            moduleSpecifier === '@example/transactional'
              ? '/workspace/libs/transactional/index.ts'
              : moduleSpecifier,
          error: null,
        })),
      sync: vi.fn(),
    } as unknown as ResolverFactory;

    const filePath = '/workspace/apps/backend/test.ts';
    const contents = `
import { NotificationDigestEmail } from '@example/transactional';

export const x = NotificationDigestEmail;
`;

    const context = {
      projectExportMap: new Map(),
      outputDirectory: '/workspace/apps/backend',
      workspacePackageDirectories: [
        '/workspace/apps/backend',
        '/workspace/libs/transactional',
      ],
      declaredPackageImportMap: new Map(),
      internalOutputRelativePaths: new Map(),
      resolver: mockResolver,
    };

    await expect(
      organizeTsTemplateImports(filePath, contents, context),
    ).rejects.toThrow(
      /Workspace package import "@example\/transactional".*must be configured as a project export or converted to a template variable/,
    );
  });

  describe('declared package imports', () => {
    const declaredPackageImportMap: DeclaredPackageImportMap = new Map([
      [
        '@example/ui-shared',
        {
          moduleSpecifier: '@example/ui-shared',
          generatorName: '@example/react-generators#core/react-components',
          projectExports: new Map([
            [
              'Loader',
              {
                name: 'Loader',
                placeholderModuleSpecifier: '%reactComponentsImports',
                providerPackagePathSpecifier:
                  '@example/react-generators:src/generators/core/react-components/generated/ts-import-providers.ts',
                providerImportName: 'reactComponentsImportsProvider',
              },
            ],
            [
              'LoaderProps',
              {
                name: 'LoaderProps',
                isTypeOnly: true,
                placeholderModuleSpecifier: '%reactComponentsImports',
                providerPackagePathSpecifier:
                  '@example/react-generators:src/generators/core/react-components/generated/ts-import-providers.ts',
                providerImportName: 'reactComponentsImportsProvider',
              },
            ],
          ]),
        },
      ],
    ]);

    // The sibling package resolves to its built barrel, which is not a template file, so
    // the mock never needs to point at anything real — declared imports short-circuit
    // resolution entirely.
    function createDeclaredImportContext(): TsTemplateImportLookupContext {
      return {
        projectExportMap: new Map(),
        outputDirectory: '/workspace/apps/web',
        workspacePackageDirectories: [
          '/workspace/apps/web',
          '/workspace/libs/ui-shared',
        ],
        declaredPackageImportMap,
        internalOutputRelativePaths: new Map(),
        resolver: createMockResolver(),
      };
    }

    it('should rewrite a declared package import to its import provider placeholder', async () => {
      const filePath = '/workspace/apps/web/router.tsx';
      const contents = `
import type { LoaderProps } from '@example/ui-shared';

import { Loader } from '@example/ui-shared';

export const x = (props: LoaderProps) => Loader(props);
`;

      const result = await organizeTsTemplateImports(
        filePath,
        contents,
        createDeclaredImportContext(),
      );

      expect(result.contents).toContain(
        'import { Loader } from "%reactComponentsImports"',
      );
      expect(result.contents).toContain(
        'import type { LoaderProps } from "%reactComponentsImports"',
      );
      expect(result.contents).not.toContain('@example/ui-shared');
      expect(result.usedProjectExports.map((e) => e.name)).toEqual([
        'LoaderProps',
        'Loader',
      ]);
    });

    it('should throw for a symbol that is not a project export of the declared provider', async () => {
      const filePath = '/workspace/apps/web/router.tsx';
      const contents = `
import { NotAComponent } from '@example/ui-shared';

export const x = NotAComponent;
`;

      await expect(
        organizeTsTemplateImports(
          filePath,
          contents,
          createDeclaredImportContext(),
        ),
      ).rejects.toThrow(
        /Import \{ NotAComponent \} from "@example\/ui-shared".*is not a project export of @example\/react-generators#core\/react-components/,
      );
    });

    it('should throw for a namespace import from a declared package', async () => {
      const filePath = '/workspace/apps/web/router.tsx';
      const contents = `
import * as UiShared from '@example/ui-shared';

export const x = UiShared.Loader;
`;

      await expect(
        organizeTsTemplateImports(
          filePath,
          contents,
          createDeclaredImportContext(),
        ),
      ).rejects.toThrow('cannot be a namespace import');
    });

    it('should throw for a side effect import of a declared package', async () => {
      const filePath = '/workspace/apps/web/router.tsx';
      const contents = `import '@example/ui-shared';\n`;

      await expect(
        organizeTsTemplateImports(
          filePath,
          contents,
          createDeclaredImportContext(),
        ),
      ).rejects.toThrow(
        /Side-effect import "@example\/ui-shared".*points at a cross-package import provider/,
      );
    });
  });

  it('should leave a real external package untouched even when a workspace directory is the project root', async () => {
    // Regression test: `workspacePackageDirectories` can include the project
    // root (which contains every package's node_modules), so a real npm
    // package resolving through node_modules must not be mistaken for a
    // sibling workspace package just because its path is nested under root.
    const mockResolver = {
      async: vi
        .fn()
        .mockImplementation((_filePath: string, moduleSpecifier: string) => ({
          path:
            moduleSpecifier === '@fastify/cookie'
              ? '/workspace/node_modules/.pnpm/@fastify+cookie@1.0.0/node_modules/@fastify/cookie/index.js'
              : moduleSpecifier,
          error: null,
        })),
      sync: vi.fn(),
    } as unknown as ResolverFactory;

    const filePath = '/workspace/apps/backend/test.ts';
    const contents = `
import { fastifyCookie } from '@fastify/cookie';

export const x = fastifyCookie;
`;

    const context = {
      projectExportMap: new Map(),
      outputDirectory: '/workspace/apps/backend',
      workspacePackageDirectories: [
        '/workspace',
        '/workspace/apps/backend',
        '/workspace/libs/transactional',
      ],
      declaredPackageImportMap: new Map(),
      internalOutputRelativePaths: new Map(),
      resolver: mockResolver,
    };

    const result = await organizeTsTemplateImports(filePath, contents, context);

    expect(result.contents).toContain(`from "@fastify/cookie"`);
  });

  describe('side effect imports', () => {
    it('should throw for a project-internal side effect import that is not a known template', async () => {
      const mockResolver = createMockResolver();
      const filePath = '/project-root/index.ts';
      const contents = `import { defineAppModule } from 'external-package';

import './schema/blog-post-like.mutations.js';
TPL_IMPORTS;

export const module = defineAppModule();
`;

      const context = {
        projectExportMap: new Map(),
        outputDirectory: '/project-root',
        workspacePackageDirectories: [],
        declaredPackageImportMap: new Map(),
        internalOutputRelativePaths: new Map(),
        resolver: mockResolver,
      };

      await expect(
        organizeTsTemplateImports(filePath, contents, context),
      ).rejects.toThrow(
        /Side-effect import .*blog-post-like.* \/project-root\/index\.ts/,
      );
    });

    it('should rewrite a side effect import pointing at another template in the generator', async () => {
      const mockResolver = createMockResolver();
      const filePath = '/project-root/index.ts';
      const contents = `import './global-types.js';

export const plugin = 'plugin';
`;

      const context = {
        projectExportMap: new Map(),
        outputDirectory: '/project-root',
        workspacePackageDirectories: [],
        declaredPackageImportMap: new Map(),
        internalOutputRelativePaths: new Map([
          ['global-types.js', 'field-authorize-global-types'],
        ]),
        resolver: mockResolver,
      };

      const result = await organizeTsTemplateImports(
        filePath,
        contents,
        context,
      );

      expect(result.contents).toContain('$fieldAuthorizeGlobalTypes');
      expect(result.contents).not.toContain('global-types.js');
      expect(
        result.referencedGeneratorTemplates.has('field-authorize-global-types'),
      ).toBe(true);
    });

    it('should leave external and builtin side effect imports untouched', async () => {
      const mockResolver = createMockResolver();
      const filePath = '/project-root/setup.ts';
      const contents = `import '@testing-library/jest-dom/vitest';
import 'node:process';

export const setup = true;
`;

      const context = {
        projectExportMap: new Map(),
        outputDirectory: '/project-root',
        workspacePackageDirectories: [],
        declaredPackageImportMap: new Map(),
        internalOutputRelativePaths: new Map(),
        resolver: mockResolver,
      };

      const result = await organizeTsTemplateImports(
        filePath,
        contents,
        context,
      );

      expect(result.contents).toContain(`'@testing-library/jest-dom/vitest'`);
      expect(result.contents).toContain(`'node:process'`);
      expect(result.referencedGeneratorTemplates.size).toBe(0);
    });

    it('should skip side effect imports whose specifier is a template variable', async () => {
      const mockResolver = createMockResolver();
      const filePath = '/project-root/index.ts';
      const contents = `import 'TPL_MODULE_PATH';

export const module = true;
`;

      const context = {
        projectExportMap: new Map(),
        outputDirectory: '/project-root',
        workspacePackageDirectories: [],
        declaredPackageImportMap: new Map(),
        internalOutputRelativePaths: new Map(),
        resolver: mockResolver,
      };

      const result = await organizeTsTemplateImports(
        filePath,
        contents,
        context,
      );

      expect(result.contents).toContain(`'TPL_MODULE_PATH'`);
    });

    it('should preserve side effect imports relative to each other', async () => {
      const mockResolver = createMockResolver();
      const filePath = '/project-root/index.ts';
      const contents = `import 'dotenv/config';
import 'reflect-metadata';

export function run() {
  return true;
}
`;

      const context = {
        projectExportMap: new Map(),
        outputDirectory: '/project-root',
        workspacePackageDirectories: [],
        declaredPackageImportMap: new Map(),
        internalOutputRelativePaths: new Map(),
        resolver: mockResolver,
      };

      const result = await organizeTsTemplateImports(
        filePath,
        contents,
        context,
      );

      expect(result.contents.indexOf(`'dotenv/config'`)).toBeLessThan(
        result.contents.indexOf(`'reflect-metadata'`),
      );
    });

    it('should ignore side effect imports inside a TPL region since it is collapsed first', async () => {
      const mockResolver = createMockResolver();
      const filePath = '/project-root/index.ts';
      // extractTsTemplateVariables collapses the marker region before this runs,
      // which is what makes generated imports invisible to import validation.
      const { content: collapsed } = extractTsTemplateVariables(
        `import { defineAppModule } from 'external-package';

/* TPL_IMPORTS:START */
import './schema/blog-post.mutations.js';
/* TPL_IMPORTS:END */

export const module = defineAppModule();
`,
      );

      const context = {
        projectExportMap: new Map(),
        outputDirectory: '/project-root',
        workspacePackageDirectories: [],
        declaredPackageImportMap: new Map(),
        internalOutputRelativePaths: new Map(),
        resolver: mockResolver,
      };

      const result = await organizeTsTemplateImports(
        filePath,
        collapsed,
        context,
      );

      expect(result.contents).toContain('TPL_IMPORTS');
      expect(result.contents).not.toContain('blog-post.mutations');
    });
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
      workspacePackageDirectories: [],
      declaredPackageImportMap: new Map(),
      internalOutputRelativePaths: new Map(),
      resolver: mockResolver,
    };

    await expect(
      organizeTsTemplateImports(filePath, contents, context),
    ).rejects.toThrow('is not found in the project exports');
  });
});
