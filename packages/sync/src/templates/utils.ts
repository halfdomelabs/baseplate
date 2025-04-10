import fs from 'node:fs/promises';
import path from 'node:path';

import type { TemplateFileSource } from './types.js';

/**
 * Reads a template file source
 *
 * @param source The source of the template file
 * @returns The contents of the template file
 */
export async function readTemplateFileSource(
  generatorBaseDirectory: string,
  source: TemplateFileSource,
): Promise<string> {
  if ('path' in source) {
    return fs.readFile(
      path.join(generatorBaseDirectory, 'templates', source.path),
      'utf8',
    );
  }

  return source.contents.toString();
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
    return fs.readFile(
      path.join(generatorBaseDirectory, 'templates', source.path),
    );
  }

  return typeof source.contents === 'string'
    ? Buffer.from(source.contents)
    : source.contents;
}
