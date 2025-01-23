import { writeFile } from 'node:fs/promises';

/**
 * Writes a JSON file with 2 spaces indentation.
 * @param filePath - The path to the file.
 * @param data - The data to write to the file.
 */
export async function writeJson(
  filePath: string,
  data: unknown,
): Promise<void> {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
}
