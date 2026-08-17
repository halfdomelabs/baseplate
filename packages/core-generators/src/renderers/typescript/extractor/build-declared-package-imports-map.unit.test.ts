import {
  addMockExtractorConfig,
  createMockContext,
} from '@baseplate-dev/sync/extractor-test-utils';
import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildDeclaredPackageImportsMap,
  PACKAGE_IMPORTS_METADATA_FILE,
} from './build-declared-package-imports-map.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');

const OUTPUT_DIRECTORY = '/test-output';
const GENERATOR_NAME = '@example/react-generators#core/react-components';

beforeEach(() => {
  vol.reset();
});

function writeMetadata(
  entries: { moduleSpecifier: string; generatorName: string }[],
): void {
  vol.fromJSON({
    [`${OUTPUT_DIRECTORY}/${PACKAGE_IMPORTS_METADATA_FILE}`]:
      JSON.stringify(entries),
  });
}

async function createContextWithComponentsGenerator(): Promise<
  Awaited<ReturnType<typeof createMockContext>>
> {
  const context = await createMockContext({
    outputDirectory: OUTPUT_DIRECTORY,
  });
  addMockExtractorConfig(context, GENERATOR_NAME, {
    name: 'core/react-components',
    templates: {
      loader: {
        type: 'ts',
        sourceFile: 'components/ui/loader.tsx',
        fileOptions: { kind: 'singleton' },
        projectExports: { Loader: {} },
      },
      field: {
        type: 'ts',
        sourceFile: 'components/ui/field.tsx',
        fileOptions: { kind: 'singleton' },
        projectExports: { FieldProps: { isTypeOnly: true } },
      },
    },
    generatorDirectory:
      '/test-packages/@example/react-generators/src/generators/core/react-components',
    packageName: '@example/react-generators',
    packagePath: '/test-packages/@example/react-generators',
  });
  return context;
}

describe('buildDeclaredPackageImportsMap', () => {
  it('should return an empty map when no metadata file exists', async () => {
    const context = await createContextWithComponentsGenerator();

    const result = await buildDeclaredPackageImportsMap(context, new Map());

    expect(result.size).toBe(0);
  });

  it('should resolve declared imports to the owning default import provider', async () => {
    writeMetadata([
      {
        moduleSpecifier: '@my-project/ui-shared',
        generatorName: GENERATOR_NAME,
      },
    ]);
    const context = await createContextWithComponentsGenerator();

    const result = await buildDeclaredPackageImportsMap(context, new Map());

    const entry = result.get('@my-project/ui-shared');
    expect(entry?.generatorName).toBe(GENERATOR_NAME);
    expect(entry?.projectExports.get('Loader')).toEqual({
      name: 'Loader',
      exportedName: undefined,
      isTypeOnly: undefined,
      placeholderModuleSpecifier: '%reactComponentsImports',
      providerPackagePathSpecifier:
        '@example/react-generators:src/generators/core/react-components/generated/ts-import-providers.ts',
      providerImportName: 'reactComponentsImportsProvider',
    });
    // exports from every template of the generator are collected, not just one
    expect(entry?.projectExports.get('FieldProps')?.isTypeOnly).toBe(true);
  });

  it('should throw when the declared generator has no TypeScript extractor config', async () => {
    writeMetadata([
      {
        moduleSpecifier: '@my-project/ui-shared',
        generatorName: '@example/react-generators#core/does-not-exist',
      },
    ]);
    const context = await createContextWithComponentsGenerator();

    await expect(
      buildDeclaredPackageImportsMap(context, new Map()),
    ).rejects.toThrow(
      /declares generator @example\/react-generators#core\/does-not-exist which has no TypeScript extractor config/,
    );
  });
});
