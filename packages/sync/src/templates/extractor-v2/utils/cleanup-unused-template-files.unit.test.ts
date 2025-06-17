import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TemplateExtractorContext } from '../runner/template-extractor-context.js';

import {
  addMockExtractorConfig,
  createMockContext,
} from '../test-utils/mock-context.js';
import { cleanupUnusedTemplateFiles } from './cleanup-unused-template-files.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');

describe('cleanupUnusedTemplateFiles', () => {
  let context: TemplateExtractorContext;

  beforeEach(() => {
    vol.reset();
  });

  beforeEach(async () => {
    context = await createMockContext({
      packageMap: new Map([['test-package', '/test/package']]),
    });
  });

  it('should delete template files not referenced in extractor.json', async () => {
    const generatorDirectory = '/test/package/generators/test';

    // Setup file system
    vol.fromJSON({
      [`${generatorDirectory}/templates/used-template.ts`]: 'used content',
      [`${generatorDirectory}/templates/unused-template.ts`]: 'unused content',
      [`${generatorDirectory}/templates/nested/another-unused.ts`]:
        'another unused',
    });

    addMockExtractorConfig(context, 'test-generator', {
      name: 'test-generator',
      generatorDirectory,
      templates: {
        'used-template.ts': { name: 'used-template', type: 'ts' },
      },
    });

    await cleanupUnusedTemplateFiles(['test-generator'], context);

    const files = vol.toJSON();
    expect(files[`${generatorDirectory}/templates/used-template.ts`]).toBe(
      'used content',
    );
    expect(
      files[`${generatorDirectory}/templates/unused-template.ts`],
    ).toBeUndefined();
    expect(
      files[`${generatorDirectory}/templates/nested/another-unused.ts`],
    ).toBeUndefined();
  });

  it('should delete generated files not being written in current extraction', async () => {
    const generatorDirectory = '/test/package/generators/test';

    // Setup file system with existing generated files
    vol.fromJSON({
      [`${generatorDirectory}/generated/old-file.ts`]: 'old content',
      [`${generatorDirectory}/generated/kept-file.ts`]: 'kept content',
      [`${generatorDirectory}/generated/nested/old-nested.ts`]: 'old nested',
    });

    addMockExtractorConfig(context, 'test-generator', {
      name: 'test-generator',
      generatorDirectory,
      templates: {},
    });

    await context.fileContainer.writeFile(
      `${generatorDirectory}/generated/kept-file.ts`,
      'new content',
    );

    await cleanupUnusedTemplateFiles(['test-generator'], context);

    const files = vol.toJSON();
    expect(
      files[`${generatorDirectory}/generated/old-file.ts`],
    ).toBeUndefined();
    expect(files[`${generatorDirectory}/generated/kept-file.ts`]).toBe(
      'kept content',
    ); // Not yet committed
    expect(
      files[`${generatorDirectory}/generated/nested/old-nested.ts`],
    ).toBeUndefined();
  });

  it('should clean up empty directories after deleting files', async () => {
    const generatorDirectory = '/test/package/generators/test';

    // Setup file system with nested directories
    vol.fromJSON({
      [`${generatorDirectory}/templates/deep/nested/unused.ts`]: 'unused',
      [`${generatorDirectory}/templates/keep/used.ts`]: 'used',
      [`${generatorDirectory}/generated/empty/nested/file.ts`]: 'file',
    });

    addMockExtractorConfig(context, 'test-generator', {
      name: 'test-generator',
      generatorDirectory,
      templates: {
        'keep/used.ts': { name: 'used-template', type: 'ts' },
      },
    });

    await cleanupUnusedTemplateFiles(['test-generator'], context);

    const files = vol.toJSON();

    // Used template should remain
    expect(files[`${generatorDirectory}/templates/keep/used.ts`]).toBe('used');

    // Unused template and its empty directories should be removed
    expect(
      files[`${generatorDirectory}/templates/deep/nested/unused.ts`],
    ).toBeUndefined();

    // Generated directory should be cleaned up
    expect(
      files[`${generatorDirectory}/generated/empty/nested/file.ts`],
    ).toBeUndefined();

    // Check that empty directories were removed by checking if any files exist in those paths
    const remainingPaths = Object.keys(files);
    expect(remainingPaths.some((p) => p.includes('/templates/deep/'))).toBe(
      false,
    );
    expect(remainingPaths.some((p) => p.includes('/generated/empty/'))).toBe(
      false,
    );
  });

  it('should handle non-existent templates directory gracefully', async () => {
    const generatorDirectory = '/test/package/generators/test';

    // No templates directory exists
    vol.fromJSON({
      [`${generatorDirectory}/extractor.json`]: '{}',
    });

    addMockExtractorConfig(context, 'test-generator', {
      name: 'test-generator',
      generatorDirectory,
      templates: {},
    });

    // Should not throw
    await expect(
      cleanupUnusedTemplateFiles(['test-generator'], context),
    ).resolves.not.toThrow();
  });

  it('should handle multiple generators', async () => {
    const generator1Directory = '/test/package/generators/gen1';
    const generator2Directory = '/test/package/generators/gen2';

    // Setup file system
    vol.fromJSON({
      [`${generator1Directory}/templates/unused1.ts`]: 'unused1',
      [`${generator1Directory}/templates/used1.ts`]: 'used1',
      [`${generator2Directory}/templates/unused2.ts`]: 'unused2',
      [`${generator2Directory}/templates/used2.ts`]: 'used2',
    });

    addMockExtractorConfig(context, 'gen1', {
      name: 'gen1',
      generatorDirectory: generator1Directory,
      templates: {
        'used1.ts': { name: 'used1', type: 'ts' },
      },
    });

    addMockExtractorConfig(context, 'gen2', {
      name: 'gen2',
      generatorDirectory: generator2Directory,
      templates: {
        'used2.ts': { name: 'used2', type: 'ts' },
      },
    });

    await cleanupUnusedTemplateFiles(['gen1', 'gen2'], context);

    const files = vol.toJSON();

    // Used files should remain
    expect(files[`${generator1Directory}/templates/used1.ts`]).toBe('used1');
    expect(files[`${generator2Directory}/templates/used2.ts`]).toBe('used2');

    // Unused files should be deleted
    expect(
      files[`${generator1Directory}/templates/unused1.ts`],
    ).toBeUndefined();
    expect(
      files[`${generator2Directory}/templates/unused2.ts`],
    ).toBeUndefined();
  });
});
