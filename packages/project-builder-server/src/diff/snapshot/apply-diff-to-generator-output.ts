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
        `File not found in generator output: ${fileEntry.path}. Please run snapshot fix-diff to fix the diffs.`,
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
        `Failed to apply patch to file ${fileEntry.path}. The patch may be invalid. Please run snapshot fix-diff to fix the diffs.`,
      );
    }
    fileData.contents = newContents;
  }

  // Inject added files that have stored content (user-created files not produced by generator)
  for (const addedEntry of snapshot.files.added) {
    if (!addedEntry.contentFile) {
      continue; // path-only entry, file exists on disk
    }
    const contentFilePath = path.join(diffDirectory, addedEntry.contentFile);
    const contents = await readFile(contentFilePath, 'utf-8').catch(
      handleFileNotFoundError,
    );
    if (!contents) {
      throw new Error(`Content file not found: ${contentFilePath}`);
    }
    generatorFiles.set(addedEntry.path, {
      id: addedEntry.path,
      contents,
    });
  }

  return {
    ...generatorOutput,
    files: generatorFiles,
  };
}
