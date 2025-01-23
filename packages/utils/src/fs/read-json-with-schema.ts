import fs from 'node:fs/promises';
import { type z, ZodError } from 'zod';

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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- z.output<T> is generic
    return await (schema.parseAsync(parsedData) as Promise<z.output<T>>);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new TypeError(
        `Validation failed for ${filePath}: ${error.message}`,
      );
    }
    if (error instanceof SyntaxError) {
      throw new TypeError(`Invalid JSON in file: ${filePath}`);
    }
    throw error;
  }
}
