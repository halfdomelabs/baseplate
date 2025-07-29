import ignore from 'ignore';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Loads ignore patterns from .baseplateignore file
 */
export async function loadIgnorePatterns(
  directory: string,
): Promise<ignore.Ignore> {
  const ignoreFilePath = path.join(directory, '.baseplateignore');
  const ig = ignore();

  // Add default patterns
  ig.add([
    '.env',
    '.env.*',
    '*.log',
    'node_modules/',
    'dist/',
    'build/',
    '.DS_Store',
    'Thumbs.db',
    '.paths-metadata.json',
    'baseplate/**/*',
    'prisma/migrations/**/*',
    'prisma/migrations_file.txt',
    'schema.graphql',
  ]);

  try {
    const content = await readFile(ignoreFilePath, 'utf8');
    ig.add(content);
  } catch {
    // File doesn't exist, use defaults only
  }

  return ig;
}

/**
 * Checks if a file path should be included based on ignore patterns
 */
export function shouldIncludeFile(
  filePath: string,
  ignoreInstance?: ignore.Ignore,
): boolean {
  // Check ignore patterns
  if (ignoreInstance?.ignores(filePath)) {
    return false;
  }

  return true;
}
