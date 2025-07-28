import type { SchemaParserContext } from '@baseplate-dev/project-builder-lib';
import type { Logger } from '@baseplate-dev/sync';

import { enhanceErrorWithContext } from '@baseplate-dev/utils';
import { handleFileNotFoundError } from '@baseplate-dev/utils/node';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type { GeneratorOperations } from '#src/sync/types.js';

import { compileApplications } from '#src/compiler/index.js';
import { getSingleAppDirectoryForProject } from '#src/project-definition/get-single-app-directory-for-project.js';
import { loadProjectDefinition } from '#src/project-definition/load-project-definition.js';
import { createTemplateMetadataOptions } from '#src/sync/template-metadata-utils.js';
import { DEFAULT_GENERATOR_OPERATIONS } from '#src/sync/types.js';

import {
  removeSnapshotDiffFile,
  saveSnapshotDiffFile,
} from './snapshot-diff-utils.js';
import {
  initializeSnapshotManifest,
  loadSnapshotManifest,
  saveSnapshotManifest,
  snapshotManifestUtils,
} from './snapshot-manifest.js';
import { resolveSnapshotDirectory } from './snapshot-utils.js';

export interface SnapshotManagementOptions {
  projectDirectory: string;
  appName: string;
  snapshotDirectory?: string;
  context: SchemaParserContext;
  logger: Logger;
  generatorOperations?: GeneratorOperations;
}

/**
 * Adds files to snapshot
 */
export async function addFilesToSnapshot(
  relativePaths: string[],
  isDeleted: boolean,
  {
    projectDirectory,
    snapshotDirectory,
    appName,
    context,
    logger,
    generatorOperations = DEFAULT_GENERATOR_OPERATIONS,
  }: SnapshotManagementOptions,
): Promise<void> {
  try {
    const { definition } = await loadProjectDefinition(
      projectDirectory,
      context,
    );
    const compiledApps = compileApplications(definition, context);
    const compiledApp = compiledApps.find((a) => a.name === appName);
    if (!compiledApp) {
      throw new Error(`App ${appName} not found`);
    }

    const appDirectory = path.join(projectDirectory, compiledApp.appDirectory);

    const snapshotDirectories = resolveSnapshotDirectory(appDirectory, {
      snapshotDir: snapshotDirectory,
    });

    logger.info(`Generating project to create snapshot...`);

    const appEntry = await generatorOperations.buildGeneratorEntry(
      compiledApp.generatorBundle,
    );
    const { files: generatedFiles } =
      await generatorOperations.executeGeneratorEntry(appEntry, {
        templateMetadataOptions: createTemplateMetadataOptions(definition),
      });

    // Load existing manifest
    let manifest =
      (await loadSnapshotManifest(snapshotDirectories)) ??
      initializeSnapshotManifest();

    for (const relativePath of relativePaths) {
      const absolutePath = path.join(appDirectory, relativePath);

      if (isDeleted) {
        if (!generatedFiles.get(relativePath)) {
          throw new Error(
            `File not found in generated output: ${relativePath}`,
          );
        }
        // Mark file as intentionally deleted
        logger.info(`Adding deleted file to snapshot: ${relativePath}`);
        manifest = snapshotManifestUtils.addDeletedFile(manifest, relativePath);
      } else {
        // Add existing file with diff
        const workingContent = await readFile(absolutePath, 'utf8').catch(
          handleFileNotFoundError,
        );

        if (!workingContent) {
          throw new Error(
            `File not found: ${absolutePath}. Use --deleted flag for deleted files.`,
          );
        }

        const generatedContent = generatedFiles.get(relativePath)?.contents;
        if (generatedContent) {
          if (Buffer.isBuffer(generatedContent)) {
            throw new TypeError(
              `Diffing binary contents is not currently supported.`,
            );
          }
          if (generatedContent === workingContent) {
            logger.warn(
              `File ${relativePath} is unchanged. Skipping snapshot generation.`,
            );
            continue;
          }
          const diffFileName = await saveSnapshotDiffFile(
            snapshotDirectories,
            relativePath,
            generatedContent,
            workingContent,
          );
          manifest = snapshotManifestUtils.addModifiedFile(
            manifest,
            relativePath,
            diffFileName,
          );
        } else {
          // Mark file as added
          manifest = snapshotManifestUtils.addAddedFile(manifest, relativePath);
        }

        logger.info(`Adding file to snapshot: ${relativePath}`);
      }
    }

    // Save updated manifest
    await saveSnapshotManifest(snapshotDirectories, manifest);

    logger.info(`✓ Added ${relativePaths.length} file(s) to snapshot`);
  } catch (error) {
    throw enhanceErrorWithContext(error, `Failed to add files to snapshot`);
  }
}

/**
 * Removes files from snapshot
 */
export async function removeFilesFromSnapshot(
  relativePaths: string[],
  {
    projectDirectory,
    appName,
    snapshotDirectory,
    context,
    logger,
  }: SnapshotManagementOptions,
): Promise<void> {
  try {
    const { definition } = await loadProjectDefinition(
      projectDirectory,
      context,
    );
    const appDirectory = getSingleAppDirectoryForProject(
      projectDirectory,
      definition,
      appName,
    );

    const snapshotDir = resolveSnapshotDirectory(appDirectory, {
      snapshotDir: snapshotDirectory,
    });

    // Load existing manifest
    let manifest = await loadSnapshotManifest(snapshotDir);

    if (!manifest) {
      throw new Error(`Snapshot not found at ${snapshotDir.path}`);
    }

    for (const relativePath of relativePaths) {
      const modifiedFile = manifest.files.modified.find(
        (entry) => entry.path === relativePath,
      );
      if (modifiedFile?.diffFile) {
        await removeSnapshotDiffFile(snapshotDir, modifiedFile.diffFile);
      }

      manifest = snapshotManifestUtils.removeFile(manifest, relativePath);
    }

    // Save updated manifest
    await saveSnapshotManifest(snapshotDir, manifest);

    logger.info(`✓ Removed ${relativePaths.length} file(s) from snapshot`);
  } catch (error) {
    logger.error(
      `Failed to remove files from snapshot: ${(error as Error).message}`,
    );
    throw error;
  }
}

export interface SnapshotListOptions {
  projectDirectory: string;
  appName: string;
  snapshotDirectory?: string;
  context: SchemaParserContext;
  logger: Logger;
}

/**
 * Lists snapshot contents
 */
export async function listSnapshotContents({
  projectDirectory,
  snapshotDirectory,
  appName,
  context,
  logger,
}: SnapshotListOptions): Promise<void> {
  try {
    const { definition } = await loadProjectDefinition(
      projectDirectory,
      context,
    );
    const appDirectory = getSingleAppDirectoryForProject(
      projectDirectory,
      definition,
      appName,
    );

    const snapshotDir = resolveSnapshotDirectory(appDirectory, {
      snapshotDir: snapshotDirectory,
    });

    // Load manifest
    const manifest = await loadSnapshotManifest(snapshotDir);

    if (!manifest) {
      throw new Error(`Snapshot not found at ${snapshotDir.path}`);
    }

    logger.info(`Snapshot contents (${snapshotDir.path}):`);

    if (manifest.files.modified.length > 0) {
      logger.info(`\\nModified files (${manifest.files.modified.length}):`);
      for (const entry of manifest.files.modified) {
        logger.info(`  ${entry.path}`);
      }
    }

    if (manifest.files.added.length > 0) {
      logger.info(`\\nAdded files (${manifest.files.added.length}):`);
      for (const file of manifest.files.added) {
        logger.info(`  ${file}`);
      }
    }

    if (manifest.files.deleted.length > 0) {
      logger.info(`\\nDeleted files (${manifest.files.deleted.length}):`);
      for (const file of manifest.files.deleted) {
        logger.info(`  ${file}`);
      }
    }

    if (
      manifest.files.modified.length === 0 &&
      manifest.files.added.length === 0 &&
      manifest.files.deleted.length === 0
    ) {
      logger.info('  (empty)');
    }
  } catch (error) {
    throw enhanceErrorWithContext(error, `Failed to list snapshot contents`);
  }
}
