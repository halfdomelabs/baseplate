import type { z } from 'zod';

import fs from 'node:fs/promises';
import { ZodError } from 'zod';

/**
 * Reads a file, parses its content as JSON, and validates it against a Zod schema.
 * @param filePath - The path to the file.
 * @param schema - The Zod schema to validate against.
 * @returns The validated data.
 * @throws If the file does not exist, contains invalid JSON, or fails schema validation.
 */
export async function readJsonWithSchema<T extends z.ZodType>(
  filePath: string,
  schema: T,
): Promise<z.output<T>> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    const parsedData = JSON.parse(fileContent) as unknown;
    return await (schema.parseAsync(parsedData) as Promise<z.output<T>>);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new TypeError(
        `Validation failed for ${filePath}: ${error.message}`,
        { cause: error },
      );
    }
    if (error instanceof SyntaxError) {
      throw new TypeError(`Invalid JSON in file: ${filePath}`, {
        cause: error,
      });
    }
    throw error;
  }
}
