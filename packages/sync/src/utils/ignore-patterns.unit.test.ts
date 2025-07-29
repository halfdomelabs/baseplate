import { vol } from 'memfs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { loadIgnorePatterns, shouldIncludeFile } from './ignore-patterns.js';

vi.mock('node:fs/promises');

describe('ignore-patterns', () => {
  afterEach(() => {
    vol.reset();
  });

  describe('loadIgnorePatterns', () => {
    it('should load default patterns when no .baseplateignore file exists', async () => {
      const ig = await loadIgnorePatterns('/test/dir');

      // Test default patterns
      expect(ig.ignores('.env')).toBe(true);
      expect(ig.ignores('.env.local')).toBe(true);
      expect(ig.ignores('debug.log')).toBe(true);
      expect(ig.ignores('node_modules/something')).toBe(true);
      expect(ig.ignores('dist/file.js')).toBe(true);
      expect(ig.ignores('build/file.js')).toBe(true);
      expect(ig.ignores('.DS_Store')).toBe(true);
      expect(ig.ignores('Thumbs.db')).toBe(true);
      expect(ig.ignores('.paths-metadata.json')).toBe(true);
      expect(ig.ignores('baseplate/project-definition.json')).toBe(true);
      expect(ig.ignores('baseplate/some-file.ts')).toBe(true);
      expect(ig.ignores('prisma/migrations/20231201_init/migration.sql')).toBe(
        true,
      );
      expect(ig.ignores('prisma/migrations/some-migration/up.sql')).toBe(true);

      // Test that normal files are not ignored
      expect(ig.ignores('src/file.ts')).toBe(false);
      expect(ig.ignores('package.json')).toBe(false);
      expect(ig.ignores('prisma/schema.prisma')).toBe(false);
      expect(ig.ignores('prisma/seed.ts')).toBe(false);
    });

    it('should load custom patterns from .baseplateignore file', async () => {
      vol.fromJSON({
        '/test/dir/.baseplateignore': 'custom-pattern.txt\n*.temp\nsecret/',
      });

      const ig = await loadIgnorePatterns('/test/dir');

      // Test custom patterns
      expect(ig.ignores('custom-pattern.txt')).toBe(true);
      expect(ig.ignores('file.temp')).toBe(true);
      expect(ig.ignores('secret/file.txt')).toBe(true);

      // Test default patterns still work
      expect(ig.ignores('.env')).toBe(true);
      expect(ig.ignores('node_modules/something')).toBe(true);

      // Test that normal files are not ignored
      expect(ig.ignores('src/file.ts')).toBe(false);
    });

    it('should handle empty .baseplateignore file', async () => {
      vol.fromJSON({
        '/test/dir/.baseplateignore': '',
      });

      const ig = await loadIgnorePatterns('/test/dir');

      // Test default patterns still work
      expect(ig.ignores('.env')).toBe(true);
      expect(ig.ignores('node_modules/something')).toBe(true);

      // Test that normal files are not ignored
      expect(ig.ignores('src/file.ts')).toBe(false);
    });
  });

  describe('shouldIncludeFile', () => {
    it('should include file when no ignore patterns provided', () => {
      expect(shouldIncludeFile('src/file.ts')).toBe(true);
      expect(shouldIncludeFile('.env')).toBe(true);
    });

    it('should exclude files based on ignore patterns', async () => {
      vol.fromJSON({
        '/test/dir/.baseplateignore': 'test-pattern.txt\n*.ignore',
      });

      const ig = await loadIgnorePatterns('/test/dir');

      expect(shouldIncludeFile('test-pattern.txt', ig)).toBe(false);
      expect(shouldIncludeFile('file.ignore', ig)).toBe(false);
      expect(shouldIncludeFile('src/file.ts', ig)).toBe(true);
    });

    it('should exclude files based on default patterns', async () => {
      const ig = await loadIgnorePatterns('/test/dir');

      expect(shouldIncludeFile('.env', ig)).toBe(false);
      expect(shouldIncludeFile('node_modules/package/file.js', ig)).toBe(false);
      expect(shouldIncludeFile('dist/bundle.js', ig)).toBe(false);
      expect(shouldIncludeFile('baseplate/project-definition.json', ig)).toBe(
        false,
      );
      expect(
        shouldIncludeFile('prisma/migrations/001_init/migration.sql', ig),
      ).toBe(false);
      expect(shouldIncludeFile('src/component.tsx', ig)).toBe(true);
      expect(shouldIncludeFile('prisma/schema.prisma', ig)).toBe(true);
    });
  });
});
