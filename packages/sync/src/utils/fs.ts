import type { z } from 'zod';

import fs from 'node:fs/promises';

/**
 * Checks if a file exists
 * @param filePath - The path to the file
 * @returns Whether the file exists
 */
export async function pathExists(filePath: string): Promise<boolean> {
  return fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);
}

/**
 * Ensures a directory exists, creating it recursively if it doesn't
 * @param directoryPath - The path to the directory
 */
export async function ensureDir(directoryPath: string): Promise<void> {
  if (await pathExists(directoryPath)) {
    return;
  }
  await fs.mkdir(directoryPath, { recursive: true });
}

/**
 * Reads a JSON file and validates it against a Zod schema
 * @param filePath - The path to the JSON file
 * @param schema - The Zod schema to validate the JSON data against
 * @returns The parsed JSON data
 */
export async function readJsonWithSchema<Schema extends z.ZodSchema>(
  filePath: string,
  schema: Schema,
): Promise<z.infer<Schema>> {
  try {
    const fileData: string = await fs.readFile(filePath, 'utf8');
    const jsonData = JSON.parse(fileData) as unknown;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- it will be typed when used generically
    return schema.parse(jsonData);
  } catch (err) {
    throw new Error(
      `Failed to read JSON file ${filePath} with schema: ${String(err)}`,
    );
  }
}
