import { vol } from 'memfs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TemplateExtractorFileContainer } from './template-extractor-file-container.js';

vi.mock('node:fs/promises');
vi.mock('#src/templates/utils/formatter.js', () => ({
  formatGeneratedTemplateContents: vi.fn((contents: string) =>
    Promise.resolve(contents),
  ),
}));

describe('TemplateExtractorFileContainer', () => {
  const packageDirs = ['/project/packages/core', '/project/packages/ui'];

  beforeEach(() => {
    vol.reset();
  });

  describe('constructor', () => {
    it('should create instance with package directories', () => {
      const container = new TemplateExtractorFileContainer(packageDirs);
      expect(container).toBeInstanceOf(TemplateExtractorFileContainer);
    });
  });

  describe('writeFile', () => {
    it('should write file within package directory', async () => {
      const container = new TemplateExtractorFileContainer(packageDirs);
      const filePath = '/project/packages/core/src/test.ts';
      const contents = 'export const test = {};';

      await container.writeFile(filePath, contents);

      const files = container.getFiles();
      expect(files.get(path.resolve(filePath))).toBe(contents);
    });

    it('should write Buffer contents', async () => {
      const container = new TemplateExtractorFileContainer(packageDirs);
      const filePath = '/project/packages/core/assets/image.png';
      const contents = Buffer.from('binary data');

      await container.writeFile(filePath, contents);

      const files = container.getFiles();
      expect(files.get(path.resolve(filePath))).toBe(contents);
    });

    it('should resolve relative paths', async () => {
      const container = new TemplateExtractorFileContainer([process.cwd()]);
      const filePath = './test.ts';
      const contents = 'export const test = {};';

      await container.writeFile(filePath, contents);

      const files = container.getFiles();
      expect(files.get(path.resolve(filePath))).toBe(contents);
    });

    it('should throw error when file already exists', async () => {
      const container = new TemplateExtractorFileContainer(packageDirs);
      const filePath = '/project/packages/core/src/test.ts';
      const contents = 'export const test = {};';

      await container.writeFile(filePath, contents);

      await expect(
        container.writeFile(filePath, 'different content'),
      ).rejects.toThrow(
        'File already written: /project/packages/core/src/test.ts',
      );
    });

    it('should throw error when writing outside package directories', async () => {
      const container = new TemplateExtractorFileContainer(packageDirs);
      const filePath = '/outside/project/test.ts';
      const contents = 'export const test = {};';

      await expect(container.writeFile(filePath, contents)).rejects.toThrow(
        `Cannot write file outside of package directories: ${path.resolve(filePath)}. Package directories: ${packageDirs.join(', ')}`,
      );
    });

    it('should allow writing to subdirectories within package dirs', async () => {
      const container = new TemplateExtractorFileContainer(packageDirs);
      const filePath = '/project/packages/core/src/components/Button.tsx';
      const contents = 'export const Button = () => {};';

      await expect(
        container.writeFile(filePath, contents),
      ).resolves.not.toThrow();

      const files = container.getFiles();
      expect(files.get(path.resolve(filePath))).toBe(contents);
    });
  });

  describe('commit', () => {
    it('should commit new file to filesystem', async () => {
      vol.fromJSON({});

      const container = new TemplateExtractorFileContainer(packageDirs);
      const filePath = '/project/packages/core/src/test.ts';
      const contents = 'export const test = {};';

      await container.writeFile(filePath, contents);
      await container.commit();

      const files = vol.toJSON();
      expect(files[filePath]).toBe(contents);
    });

    it('should create directories if they do not exist', async () => {
      vol.fromJSON({});

      const container = new TemplateExtractorFileContainer(packageDirs);
      const filePath = '/project/packages/core/src/deep/nested/test.ts';
      const contents = 'export const test = {};';

      await container.writeFile(filePath, contents);
      await container.commit();

      const files = vol.toJSON();
      expect(files[filePath]).toBe(contents);
      // File should exist in the nested directory
      expect(files[filePath]).toBeDefined();
    });

    it('should not overwrite file with identical contents', async () => {
      const contents = 'export const test = {};';
      const filePath = '/project/packages/core/src/test.ts';

      vol.fromJSON({
        [filePath]: contents,
      });

      const container = new TemplateExtractorFileContainer(packageDirs);
      await container.writeFile(filePath, contents);

      // Mock fs.writeFile to track calls
      const writeFileSpy = vi.fn();
      vi.doMock('node:fs/promises', async () => ({
        ...(await vi.importActual('node:fs/promises')),
        writeFile: writeFileSpy,
      }));

      await container.commit();

      // Should not call writeFile since contents are identical
      expect(writeFileSpy).not.toHaveBeenCalled();
    });

    it('should overwrite file with different contents', async () => {
      const oldContents = 'export const old = {};';
      const newContents = 'export const new = {};';
      const filePath = '/project/packages/core/src/test.ts';

      vol.fromJSON({
        [filePath]: oldContents,
      });

      const container = new TemplateExtractorFileContainer(packageDirs);
      await container.writeFile(filePath, newContents);
      await container.commit();

      const files = vol.toJSON();
      expect(files[filePath]).toBe(newContents);
    });

    it('should commit multiple files', async () => {
      vol.fromJSON({});

      const container = new TemplateExtractorFileContainer(packageDirs);

      const files = [
        {
          path: '/project/packages/core/src/file1.ts',
          content: 'export const file1 = {};',
        },
        {
          path: '/project/packages/ui/src/file2.ts',
          content: 'export const file2 = {};',
        },
        {
          path: '/project/packages/core/assets/data.json',
          content: '{"key": "value"}',
        },
      ];

      for (const file of files) {
        await container.writeFile(file.path, file.content);
      }

      await container.commit();

      const volFiles = vol.toJSON();
      for (const file of files) {
        expect(volFiles[file.path]).toBe(file.content);
      }
    });

    it('should handle Buffer contents correctly', async () => {
      vol.fromJSON({});

      const container = new TemplateExtractorFileContainer(packageDirs);
      const filePath = '/project/packages/core/assets/image.png';
      const contents = Buffer.from('binary image data');

      await container.writeFile(filePath, contents);
      await container.commit();

      const files = vol.toJSON();
      const fileContent = files[filePath];
      if (typeof fileContent === 'string') {
        expect(Buffer.from(fileContent)).toEqual(contents);
      } else {
        throw new TypeError('Expected file content to be a string');
      }
    });

    it('should call formatter for string contents', async () => {
      const { formatGeneratedTemplateContents } = await import(
        '#src/templates/utils/formatter.js'
      );

      vol.fromJSON({});

      const container = new TemplateExtractorFileContainer(packageDirs);
      const filePath = '/project/packages/core/src/test.ts';
      const contents = 'export const test = {};';

      await container.writeFile(filePath, contents);
      await container.commit();

      expect(formatGeneratedTemplateContents).toHaveBeenCalledWith(
        contents,
        filePath,
      );
    });

    it('should not call formatter for Buffer contents', async () => {
      const { formatGeneratedTemplateContents } = await import(
        '#src/templates/utils/formatter.js'
      );

      vol.fromJSON({});

      const container = new TemplateExtractorFileContainer(packageDirs);
      const filePath = '/project/packages/core/assets/data.bin';
      const contents = Buffer.from('binary data');

      await container.writeFile(filePath, contents);
      await container.commit();

      expect(formatGeneratedTemplateContents).not.toHaveBeenCalledWith(
        contents,
        filePath,
      );
    });
  });

  describe('getFiles', () => {
    it('should return readonly map of files', async () => {
      const container = new TemplateExtractorFileContainer(packageDirs);
      const filePath = '/project/packages/core/src/test.ts';
      const contents = 'export const test = {};';

      await container.writeFile(filePath, contents);

      const files = container.getFiles();
      expect(files).toBeInstanceOf(Map);
      expect(files.get(path.resolve(filePath))).toBe(contents);
    });

    it('should return empty map when no files written', () => {
      const container = new TemplateExtractorFileContainer(packageDirs);
      const files = container.getFiles();

      expect(files).toBeInstanceOf(Map);
      expect(files.size).toBe(0);
    });
  });
});
