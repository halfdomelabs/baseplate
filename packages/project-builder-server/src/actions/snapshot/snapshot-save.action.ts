import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';
import { createNodeSchemaParserContext } from '#src/plugins/node-plugin-store.js';

import { getProjectByNameOrId } from '../utils/projects.js';

const snapshotSaveInputSchema = z.object({
  project: z.string().describe('The name or ID of the project.'),
  app: z
    .string()
    .optional()
    .describe(
      'The app name within the project. If omitted, saves snapshots for all apps.',
    ),
  force: z
    .boolean()
    .optional()
    .describe('Skip confirmation prompt and force save snapshot.'),
});

const snapshotSaveOutputSchema = z.object({
  success: z
    .boolean()
    .describe('Whether the snapshot save operation was successful.'),
  message: z.string().describe('Result message.'),
  snapshotPath: z.string().optional().describe('Path to the saved snapshot.'),
  savedApps: z
    .array(z.string())
    .optional()
    .describe('List of app names that had snapshots saved.'),
});

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
    const { project: projectId, app, force = false } = input;
    const { projects, logger, plugins, userConfig, cliVersion } = context;

    try {
      // Find the project by name or ID
      const project = getProjectByNameOrId(projects, projectId);

      const target = app ? `app: ${app}` : 'all apps';
      logger.info(`Saving snapshot for project: ${project.name}, ${target}`);

      // Create schema parser context
      const schemaContext = await createNodeSchemaParserContext(
        project,
        logger,
        plugins,
        cliVersion,
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

      const { createSnapshotForProject } =
        await import('#src/diff/snapshot/create-snapshot-for-project.js');

      const savedApps = await createSnapshotForProject({
        projectDirectory: project.directory,
        app,
        logger,
        context: schemaContext,
        userConfig,
      });

      return {
        success: true,
        message: `Snapshot saved successfully for ${project.name}${app ? `/${app}` : ` (${savedApps.length} app(s))`}`,
        savedApps,
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
      if (
        output.savedApps &&
        output.savedApps.length > 0 &&
        !output.snapshotPath
      ) {
        for (const app of output.savedApps) {
          console.info(`   Saved: ${app}`);
        }
      }
    } else {
      console.error(`✗ ${output.message}`);
    }
  },
});
