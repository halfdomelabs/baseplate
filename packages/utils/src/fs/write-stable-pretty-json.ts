import { writeFile } from 'node:fs/promises';

import { stringifyPrettyStable } from '#src/json/stringify-pretty-stable.js';

/**
 * Writes a JSON file with stable pretty printing.
 *
 * That means the keys are sorted and the value is pretty printed.
 *
 * @param filePath - The path to the file.
 * @param data - The data to write to the file.
 */
export async function writeStablePrettyJson(
  filePath: string,
  data: object,
): Promise<void> {
  const json = stringifyPrettyStable(data);
  await writeFile(filePath, json, { encoding: 'utf8' });
}
