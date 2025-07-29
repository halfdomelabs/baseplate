import type { PreviousGeneratedPayload } from '@baseplate-dev/sync';

import { createCodebaseFileReaderFromDirectory } from '@baseplate-dev/sync';
import { dirExists } from '@baseplate-dev/utils/node';
import path from 'node:path';

import { getPreviousGeneratedFileIdMap } from './file-id-map.js';

export const GENERATED_DIRECTORY = 'baseplate/generated';

/**
 * Gets the previous generated payload for a project
 * @param projectDirectory - The directory of the project
 * @returns The previous generated payload
 */
export async function getPreviousGeneratedPayload(
  projectDirectory: string,
): Promise<PreviousGeneratedPayload | undefined> {
  const generatedDirectory = path.join(projectDirectory, GENERATED_DIRECTORY);

  const generatedDirectoryExists = await dirExists(generatedDirectory);

  if (!generatedDirectoryExists) {
    return undefined;
  }

  const fileIdMap = await getPreviousGeneratedFileIdMap(projectDirectory);

  return {
    fileReader: createCodebaseFileReaderFromDirectory(generatedDirectory),
    fileIdToRelativePathMap: fileIdMap,
  };
}
