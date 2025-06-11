import { handleFileNotFoundError } from '@baseplate-dev/utils/node';
import fs from 'node:fs/promises';
import path from 'node:path';

import type { TemplateFileSource } from '../types.js';

/**
 * Reads a template file source as a string
 *
 * @param source The source of the template file
 * @returns The contents of the template file
 */
export async function readTemplateFileSource(
  generatorBaseDirectory: string,
  source: TemplateFileSource,
): Promise<string> {
  return readTemplateFileSourceBuffer(generatorBaseDirectory, source).then(
    (buffer) => buffer.toString(),
  );
}

/**
 * Reads a template file source as a buffer
 *
 * @param source The source of the template file
 * @returns The contents of the template file as a buffer
 */
export async function readTemplateFileSourceBuffer(
  generatorBaseDirectory: string,
  source: TemplateFileSource,
): Promise<Buffer> {
  if ('path' in source) {
    // TODO[2025-06-12]: Remove once we've migrated to v2 of template system
    const templatePath = path.isAbsolute(source.path)
      ? source.path
      : path.join(generatorBaseDirectory, 'templates', source.path);
    const fileContents = await fs
      .readFile(templatePath)
      .catch(handleFileNotFoundError);
    if (!fileContents) {
      throw new Error(
        `Could not find template file in project: ${source.path}`,
      );
    }
    return fileContents;
  }

  return typeof source.contents === 'string'
    ? Buffer.from(source.contents)
    : source.contents;
}
