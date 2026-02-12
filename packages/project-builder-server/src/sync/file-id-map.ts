import { compareStrings, enhanceErrorWithContext } from '@baseplate-dev/utils';
import {
  handleFileNotFoundError,
  readJsonWithSchema,
  writeJson,
} from '@baseplate-dev/utils/node';
import path from 'node:path';
import { z } from 'zod';

const FILE_ID_MAP_PATH = 'baseplate/file-id-map.json';

/**
 * Gets the previous generated file id map from the project directory.
 *
 * @param projectDirectory - The project directory.
 * @returns A map of file ids to relative paths.
 */
export async function getPreviousGeneratedFileIdMap(
  projectDirectory: string,
): Promise<Map<string, string>> {
  const generatedFileIdMapPath = path.join(projectDirectory, FILE_ID_MAP_PATH);
  try {
    const fileIdMap = await readJsonWithSchema(
      generatedFileIdMapPath,
      z.record(z.string(), z.string()),
    ).catch(handleFileNotFoundError);

    if (!fileIdMap) {
      return new Map();
    }

    return new Map(Object.entries(fileIdMap));
  } catch (err) {
    throw enhanceErrorWithContext(
      err,
      `Failed to get previous generated file id map (${generatedFileIdMapPath})`,
    );
  }
}

/**
 * Writes the generated file id map to the project directory.
 *
 * @param projectDirectory - The project directory.
 * @param fileIdToRelativePathMap - A map of file ids to relative paths.
 */
export async function writeGeneratedFileIdMap(
  projectDirectory: string,
  fileIdToRelativePathMap: Map<string, string>,
): Promise<void> {
  const fileIdMapPath = path.join(projectDirectory, FILE_ID_MAP_PATH);
  const fileIdMap = Object.fromEntries(
    [...fileIdToRelativePathMap.entries()].toSorted(([a], [b]) =>
      compareStrings(a, b),
    ),
  );
  await writeJson(fileIdMapPath, fileIdMap);
}
