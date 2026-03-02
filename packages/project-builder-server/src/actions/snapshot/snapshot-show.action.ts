import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';

import { getProjectByNameOrId } from '../utils/projects.js';

const snapshotShowInputSchema = z.object({
  project: z.string().describe('The name or ID of the project.'),
  app: z.string().describe('The app name within the project.'),
  baseplateDirectory: z
    .string()
    .optional()
    .describe(
      'Custom baseplate directory for snapshot resolution. Defaults to <projectDirectory>/baseplate.',
    ),
});

const snapshotFileEntry = z.object({
  path: z.string().describe('File path.'),
  diffFile: z.string().optional().describe('Associated diff file if modified.'),
});

const snapshotShowOutputSchema = z.object({
  success: z
    .boolean()
    .describe('Whether the snapshot show operation was successful.'),
  message: z.string().describe('Result message.'),
  snapshotPath: z
    .string()
    .optional()
    .describe('Path to the snapshot directory.'),
  files: z
    .object({
      modified: z
        .array(snapshotFileEntry)
        .describe('Modified files in snapshot.'),
      added: z
        .array(
          z.object({
            path: z.string().describe('File path.'),
            contentFile: z
              .string()
              .optional()
              .describe('Associated content file.'),
          }),
        )
        .describe('Added files in snapshot.'),
      deleted: z.array(z.string()).describe('Deleted files in snapshot.'),
    })
    .describe('Files tracked in the snapshot.'),
  totalFiles: z.number().describe('Total number of files in snapshot.'),
});

/**
 * Service action to show contents of a project snapshot.
 */
export const snapshotShowAction = createServiceAction({
  name: 'snapshot-show',
  title: 'Show Snapshot Contents',
  description: 'Display current snapshot contents and tracked files',
  inputSchema: snapshotShowInputSchema,
  outputSchema: snapshotShowOutputSchema,
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
      const { resolveSnapshotDirectory, resolveBaseplateDir } =
        await import('#src/diff/snapshot/snapshot-utils.js');
      const baseplateDirectory = resolveBaseplateDir(
        project.directory,
        input.baseplateDirectory,
      );
      const snapshotDir = resolveSnapshotDirectory(baseplateDirectory, app);

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
