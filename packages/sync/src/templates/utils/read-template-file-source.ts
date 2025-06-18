import { handleFileNotFoundError } from '@baseplate-dev/utils/node';
import fs from 'node:fs/promises';

import type { TemplateFileSource } from '../types.js';

/**
 * Reads a template file source as a string
 *
 * @param source The source of the template file
 * @returns The contents of the template file
 */
export async function readTemplateFileSource(
  source: TemplateFileSource,
): Promise<string> {
  return readTemplateFileSourceBuffer(source).then((buffer) =>
    buffer.toString(),
  );
}

/**
 * Reads a template file source as a buffer
 *
 * @param source The source of the template file
 * @returns The contents of the template file as a buffer
 */
export async function readTemplateFileSourceBuffer(
  source: TemplateFileSource,
): Promise<Buffer> {
  if ('path' in source) {
    const fileContents = await fs
      .readFile(source.path)
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
