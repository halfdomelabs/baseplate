import type { FileData, GeneratorOutput } from '@baseplate-dev/sync';

import { handleFileNotFoundError } from '@baseplate-dev/utils/node';
import { applyPatch } from 'diff';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type { SnapshotManifest } from './snapshot-types.js';

export async function applySnapshotToGeneratorOutput(
  generatorOutput: GeneratorOutput,
  snapshot: SnapshotManifest,
  diffDirectory: string,
): Promise<GeneratorOutput> {
  const generatorFiles = new Map<string, FileData>(
    [...generatorOutput.files].filter(
      ([filePath]) => !snapshot.files.deleted.includes(filePath),
    ),
  );
  for (const fileEntry of snapshot.files.modified) {
    const fileData = generatorFiles.get(fileEntry.path);
    if (!fileData) {
      throw new Error(
        `File not found in generator output: ${fileEntry.path}. Please run fix-diff to fix the diffs.`,
      );
    }
    const diffFilePath = path.join(diffDirectory, fileEntry.diffFile);
    const diffFile = await readFile(diffFilePath, 'utf-8').catch(
      handleFileNotFoundError,
    );
    if (!diffFile) {
      throw new Error(`Diff file not found: ${diffFilePath}`);
    }

    const newContents = applyPatch(fileData.contents.toString(), diffFile);
    if (!newContents) {
      throw new Error(
        `Failed to apply patch to file ${fileEntry.path}. The patch may be invalid. Please run fix-diff to fix the diffs.`,
      );
    }
    fileData.contents = newContents;
  }
  return {
    ...generatorOutput,
    files: generatorFiles,
  };
}
