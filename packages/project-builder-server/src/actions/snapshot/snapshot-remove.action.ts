import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';
import { createNodeSchemaParserContext } from '#src/plugins/node-plugin-store.js';

import { getProjectByNameOrId } from '../utils/projects.js';

const snapshotRemoveInputSchema = z.object({
  project: z.string().describe('The name or ID of the project.'),
  app: z.string().describe('The app name within the project.'),
  files: z
    .array(z.string())
    .describe('Array of file paths to remove from snapshot.'),
  snapshotDirectory: z
    .string()
    .optional()
    .describe('Custom snapshot directory (defaults to .baseplate-snapshot).'),
});

const snapshotRemoveOutputSchema = z.object({
  success: z
    .boolean()
    .describe('Whether the snapshot remove operation was successful.'),
  message: z.string().describe('Result message.'),
  filesRemoved: z
    .number()
    .describe('Number of files removed from the snapshot.'),
});

/**
 * Service action to remove files from a project snapshot.
 */
export const snapshotRemoveAction = createServiceAction({
  name: 'snapshot-remove',
  title: 'Remove Files from Snapshot',
  description: 'Remove files from snapshot tracking',
  inputSchema: snapshotRemoveInputSchema,
  outputSchema: snapshotRemoveOutputSchema,
  handler: async (input, context) => {
    const {
      project: projectId,
      app,
      files,
      snapshotDirectory = '.baseplate-snapshot',
    } = input;
    const { projects, logger, plugins, cliVersion } = context;

    try {
      // Find the project by name or ID
      const project = getProjectByNameOrId(projects, projectId);

      logger.info(
        `Removing ${files.length} file(s) from snapshot for project: ${project.name}, app: ${app}`,
      );

      // Create schema parser context
      const schemaContext = await createNodeSchemaParserContext(
        project,
        logger,
        plugins,
        cliVersion,
      );

      const { removeFilesFromSnapshot } =
        await import('#src/diff/snapshot/snapshot-management.js');

      await removeFilesFromSnapshot(files, {
        projectDirectory: project.directory,
        snapshotDirectory,
        appName: app,
        context: schemaContext,
        logger,
      });

      return {
        success: true,
        message: `Successfully removed ${files.length} file(s) from snapshot`,
        filesRemoved: files.length,
      };
    } catch (error) {
      logger.error(
        `Failed to remove files from snapshot for project ${projectId}: ${String(error)}`,
      );
      return {
        success: false,
        message: `Failed to remove files from snapshot: ${error instanceof Error ? error.message : String(error)}`,
        filesRemoved: 0,
      };
    }
  },
  writeCliOutput: (output) => {
    if (output.success) {
      console.info(`✓ ${output.message}`);
    } else {
      console.error(`✗ ${output.message}`);
    }
  },
});
