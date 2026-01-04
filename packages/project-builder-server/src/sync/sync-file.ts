import type { Logger, TemplateMetadataOptions } from '@baseplate-dev/sync';

import { formatOutputFileContents } from '@baseplate-dev/sync';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { PackageEntry } from '#src/compiler/package-entry.js';

import type { GeneratorOperations } from './types.js';

import { GENERATED_DIRECTORY } from './get-previous-generated-payload.js';
import { DEFAULT_GENERATOR_OPERATIONS } from './types.js';

interface SyncFileOptions {
  baseDirectory: string;
  appEntry: PackageEntry;
  logger: Logger;
  fileGlobs: string[];
  writeTemplateMetadataOptions?: TemplateMetadataOptions;
  operations?: GeneratorOperations;
}

interface SyncFileResult {
  filesApplied: string[];
  errors: string[];
}

/**
 * Syncs specific files from generator output to the working directory.
 *
 * Unlike full sync, this command:
 * - Runs generators and filters files by glob
 * - Writes matching files directly to working directory AND generated folder
 * - Does NOT perform the full generated folder swap
 * - Allows incremental fixing of generators one file at a time
 */
export async function syncFile({
  baseDirectory,
  appEntry,
  logger,
  fileGlobs,
  writeTemplateMetadataOptions,
  operations = DEFAULT_GENERATOR_OPERATIONS,
}: SyncFileOptions): Promise<SyncFileResult> {
  const { packageDirectory, name, generatorBundle } = appEntry;
  const projectDirectory = path.join(baseDirectory, packageDirectory);

  logger.info(`Running generators for ${name}...`);

  // Build and execute generators to get output files
  const project = await operations.buildGeneratorEntry(generatorBundle);
  const output = await operations.executeGeneratorEntry(project, {
    templateMetadataOptions: writeTemplateMetadataOptions,
  });

  logger.info(`Generator output contains ${output.files.size} files`);

  // Filter files by globs using dynamic import for micromatch
  const { default: micromatch } = await import('micromatch');
  const allFilePaths = [...output.files.keys()];
  const matchingPaths = micromatch(allFilePaths, fileGlobs);

  if (matchingPaths.length === 0) {
    logger.warn(`No files matched the provided globs: ${fileGlobs.join(', ')}`);
    return { filesApplied: [], errors: [] };
  }

  logger.info(`Found ${matchingPaths.length} files matching globs`);

  const filesApplied: string[] = [];
  const errors: string[] = [];

  // Process each matching file
  for (const relativePath of matchingPaths) {
    const fileData = output.files.get(relativePath);
    if (!fileData) {
      continue;
    }

    try {
      // Format the file contents
      const formattedContents = await formatOutputFileContents(
        relativePath,
        fileData,
        {
          outputDirectory: projectDirectory,
          formatters: output.globalFormatters,
          logger,
        },
      );

      // Normalize to buffer for writing
      const contentsBuffer =
        typeof formattedContents === 'string'
          ? Buffer.from(formattedContents, 'utf8')
          : formattedContents;

      // Write to working directory
      const workingPath = path.join(projectDirectory, relativePath);
      await mkdir(path.dirname(workingPath), { recursive: true });
      await writeFile(workingPath, contentsBuffer);

      // Write to generated directory
      const generatedPath = path.join(
        projectDirectory,
        GENERATED_DIRECTORY,
        relativePath,
      );
      await mkdir(path.dirname(generatedPath), { recursive: true });
      await writeFile(generatedPath, contentsBuffer);

      filesApplied.push(relativePath);
      logger.debug(`Applied: ${relativePath}`);
    } catch (err) {
      const errorMessage = `Failed to apply ${relativePath}: ${err instanceof Error ? err.message : String(err)}`;
      errors.push(errorMessage);
      logger.error(errorMessage);
    }
  }

  if (filesApplied.length > 0) {
    logger.info(`Successfully applied ${filesApplied.length} files`);
  }

  if (errors.length > 0) {
    logger.error(`Encountered ${errors.length} errors`);
  }

  return { filesApplied, errors };
}
