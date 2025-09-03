import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';
import { createSnapshotForProject } from '#src/diff/snapshot/create-snapshot-for-project.js';
import { createNodeSchemaParserContext } from '#src/plugins/node-plugin-store.js';

import { getProjectByNameOrId } from '../utils/projects.js';

const snapshotSaveInputSchema = {
  project: z.string().describe('The name or ID of the project.'),
  app: z.string().describe('The app name within the project.'),
  snapshotDirectory: z
    .string()
    .optional()
    .describe('Custom snapshot directory (defaults to .baseplate-snapshot).'),
  force: z
    .boolean()
    .optional()
    .describe('Skip confirmation prompt and force save snapshot.'),
};

const snapshotSaveOutputSchema = {
  success: z
    .boolean()
    .describe('Whether the snapshot save operation was successful.'),
  message: z.string().describe('Result message.'),
  snapshotPath: z.string().optional().describe('Path to the saved snapshot.'),
};

/**
 * Service action to save a complete snapshot for a project.
 */
export const snapshotSaveAction = createServiceAction({
  name: 'snapshot-save',
  title: 'Save Project Snapshot',
  description:
    'Save snapshot of current differences (overwrites existing snapshot)',
  inputSchema: snapshotSaveInputSchema,
  outputSchema: snapshotSaveOutputSchema,
  handler: async (input, context) => {
    const {
      project: projectId,
      app,
      snapshotDirectory = '.baseplate-snapshot',
      force = false,
    } = input;
    const { projects, logger, plugins, userConfig } = context;

    try {
      // Find the project by name or ID
      const project = getProjectByNameOrId(projects, projectId);

      logger.info(`Saving snapshot for project: ${project.name}, app: ${app}`);

      // Create schema parser context
      const schemaContext = await createNodeSchemaParserContext(
        project.directory,
        logger,
        plugins,
      );

      if (!force) {
        logger.warn(
          '⚠️  This will overwrite any existing snapshot for this app.',
        );
        logger.info(
          'Use granular commands (snapshot-add/snapshot-remove) for safer updates.',
        );
        logger.info(
          'Use force: true to skip this warning when calling via MCP.',
        );
      }

      await createSnapshotForProject({
        projectDirectory: project.directory,
        app,
        logger,
        context: schemaContext,
        userConfig,
        snapshotDir: snapshotDirectory,
      });

      return {
        success: true,
        message: `Snapshot saved successfully for ${project.name}/${app}`,
        snapshotPath: `${project.directory}/${app}/${snapshotDirectory}`,
      };
    } catch (error) {
      logger.error(
        `Failed to save snapshot for project ${projectId}: ${String(error)}`,
      );
      return {
        success: false,
        message: `Failed to save snapshot: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
  writeCliOutput: (output) => {
    if (output.success) {
      console.info(`✓ ${output.message}`);
      if (output.snapshotPath) {
        console.info(`   Saved to: ${output.snapshotPath}`);
      }
    } else {
      console.error(`✗ ${output.message}`);
    }
  },
});
