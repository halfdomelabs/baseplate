import { createServiceAction } from '#src/actions/types.js';

import { getProjectByNameOrId } from '../utils/projects.js';
import { snapshotShowMetadata } from './snapshot-show.action-metadata.js';

/**
 * Service action to show contents of a project snapshot.
 */
export const snapshotShowAction = createServiceAction({
  ...snapshotShowMetadata,
  handler: async (input, context) => {
    const { project: projectId, app } = input;
    const { projects, logger } = context;

    try {
      // Find the project by name or ID
      const project = getProjectByNameOrId(projects, projectId);

      logger.info(
        `Showing snapshot contents for project: ${project.name}, app: ${app}`,
      );

      const { loadSnapshotManifest } =
        await import('#src/diff/snapshot/snapshot-manifest.js');
      const { resolveSnapshotDirectory } =
        await import('#src/diff/snapshot/snapshot-utils.js');
      const baseplateDir =
        input.baseplateDirectory ?? project.baseplateDirectory;
      const snapshotDir = resolveSnapshotDirectory(baseplateDir, app);

      const manifest = await loadSnapshotManifest(snapshotDir);

      if (!manifest) {
        return {
          success: false,
          message: `No snapshot found for ${project.name}/${app}`,
          files: { modified: [], added: [], deleted: [] },
          totalFiles: 0,
        };
      }

      const totalFiles =
        manifest.files.modified.length +
        manifest.files.added.length +
        manifest.files.deleted.length;

      return {
        success: true,
        message: `Snapshot contains ${totalFiles} tracked file(s)`,
        snapshotPath: snapshotDir.path,
        files: {
          modified: manifest.files.modified.map((entry) => ({
            path: entry.path,
            diffFile: entry.diffFile,
          })),
          added: manifest.files.added,
          deleted: manifest.files.deleted,
        },
        totalFiles,
      };
    } catch (error) {
      logger.error(
        `Failed to show snapshot for project ${projectId}: ${String(error)}`,
      );
      return {
        success: false,
        message: `Failed to show snapshot: ${error instanceof Error ? error.message : String(error)}`,
        files: { modified: [], added: [], deleted: [] },
        totalFiles: 0,
      };
    }
  },
  writeCliOutput: (output) => {
    if (output.success) {
      console.info(`✓ ${output.message}`);
      if (output.snapshotPath) {
        console.info(`   Location: ${output.snapshotPath}`);
      }

      if (output.files.modified.length > 0) {
        console.info(`\nModified files (${output.files.modified.length}):`);
        for (const entry of output.files.modified) {
          console.info(`  ${entry.path}`);
        }
      }

      if (output.files.added.length > 0) {
        console.info(`\nAdded files (${output.files.added.length}):`);
        for (const entry of output.files.added) {
          console.info(`  ${entry.path}`);
        }
      }

      if (output.files.deleted.length > 0) {
        console.info(`\nDeleted files (${output.files.deleted.length}):`);
        for (const file of output.files.deleted) {
          console.info(`  ${file}`);
        }
      }

      if (output.totalFiles === 0) {
        console.info('  (empty)');
      }
    } else {
      console.error(`✗ ${output.message}`);
    }
  },
});
