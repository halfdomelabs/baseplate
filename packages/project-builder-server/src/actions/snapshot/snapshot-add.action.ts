import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';
import { createNodeSchemaParserContext } from '#src/plugins/node-plugin-store.js';

import { getProjectByNameOrId } from '../utils/projects.js';

const snapshotAddInputSchema = z.object({
  project: z.string().describe('The name or ID of the project.'),
  app: z.string().describe('The app name within the project.'),
  files: z
    .array(z.string())
    .describe('Array of file paths to add to snapshot.'),
  deleted: z
    .boolean()
    .optional()
    .describe('Mark files as intentionally deleted in snapshot.'),
  snapshotDirectory: z
    .string()
    .optional()
    .describe('Custom snapshot directory (defaults to .baseplate-snapshot).'),
});

const snapshotAddOutputSchema = z.object({
  success: z
    .boolean()
    .describe('Whether the snapshot add operation was successful.'),
  message: z.string().describe('Result message.'),
  filesAdded: z.number().describe('Number of files added to the snapshot.'),
});

/**
 * Service action to add files to a project snapshot.
 */
export const snapshotAddAction = createServiceAction({
  name: 'snapshot-add',
  title: 'Add Files to Snapshot',
  description: 'Add files to snapshot for persistent differences tracking',
  inputSchema: snapshotAddInputSchema,
  outputSchema: snapshotAddOutputSchema,
  handler: async (input, context) => {
    const {
      project: projectId,
      app,
      files,
      deleted = false,
      snapshotDirectory = '.baseplate-snapshot',
    } = input;
    const { projects, logger, plugins, cliVersion } = context;

    try {
      // Find the project by name or ID
      const project = getProjectByNameOrId(projects, projectId);

      logger.info(
        `Adding ${files.length} file(s) to snapshot for project: ${project.name}, app: ${app}`,
      );

      // Create schema parser context
      const schemaContext = await createNodeSchemaParserContext(
        project,
        logger,
        plugins,
        cliVersion,
      );

      const { addFilesToSnapshot } = await import(
        '#src/diff/snapshot/snapshot-management.js'
      );

      await addFilesToSnapshot(files, deleted, {
        projectDirectory: project.directory,
        snapshotDirectory,
        appName: app,
        context: schemaContext,
        logger,
      });

      const message = deleted
        ? `Successfully added ${files.length} deleted file(s) to snapshot`
        : `Successfully added ${files.length} file(s) to snapshot`;

      return {
        success: true,
        message,
        filesAdded: files.length,
      };
    } catch (error) {
      logger.error(
        `Failed to add files to snapshot for project ${projectId}: ${String(error)}`,
      );
      return {
        success: false,
        message: `Failed to add files to snapshot: ${error instanceof Error ? error.message : String(error)}`,
        filesAdded: 0,
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
