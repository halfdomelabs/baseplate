import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';
import { createNodeSchemaParserContext } from '#src/plugins/node-plugin-store.js';
import { SyncMetadataController } from '#src/sync/sync-metadata-controller.js';
import { packageSyncResultSchema } from '#src/sync/sync-metadata.js';

import { getProjectByNameOrId } from '../utils/projects.js';

const syncProjectInputSchema = z.object({
  project: z.string().describe('The name or ID of the project to sync.'),
  overwrite: z
    .boolean()
    .optional()
    .describe('Whether to force overwrite existing files and apply snapshot.'),
  skipCommands: z
    .boolean()
    .optional()
    .describe('Whether to skip running commands.'),
  snapshotDirectory: z
    .string()
    .optional()
    .describe('Directory containing snapshot to use when generating.'),
  packages: z
    .array(z.string())
    .optional()
    .describe('Only sync specific packages by name.'),
});

const syncProjectOutputSchema = z.object({
  status: z
    .enum(['success', 'error', 'cancelled'])
    .describe('The status of the sync operation.'),
  packageSyncResults: z
    .record(z.string(), packageSyncResultSchema.optional())
    .optional()
    .describe('The results of the sync for each package.'),
  message: z.string().describe('Human-readable result message.'),
});

/**
 * Service action to sync a project.
 */
export const syncProjectAction = createServiceAction({
  name: 'sync-project',
  title: 'Sync Project',
  description: 'Sync the specified project using the baseplate sync engine',
  inputSchema: syncProjectInputSchema,
  outputSchema: syncProjectOutputSchema,
  handler: async (input, context) => {
    const {
      project: projectId,
      overwrite,
      skipCommands,
      snapshotDirectory,
      packages,
    } = input;
    const { projects, logger, plugins, userConfig, cliVersion } = context;

    // Find the project by name or ID
    const project = getProjectByNameOrId(projects, projectId);

    logger.info(`Starting sync for project: ${project.name}`);

    try {
      // Create schema parser context
      const schemaParserContext = await createNodeSchemaParserContext(
        project,
        logger,
        plugins,
        cliVersion,
      );

      // Create sync metadata controller
      const syncMetadataController = new SyncMetadataController(
        project.directory,
        logger,
      );

      const { syncProject } = await import('../../sync/sync-project.js');

      const result = await syncProject({
        directory: project.directory,
        logger,
        context: schemaParserContext,
        userConfig,
        syncMetadataController,
        overwrite,
        skipCommands,
        snapshotDirectory,
        packageFilter: packages,
      });

      const statusMessage =
        result.status === 'success'
          ? 'Project synced successfully'
          : result.status === 'cancelled'
            ? 'Project sync was cancelled'
            : 'Project sync failed';

      // Map the sync status to action output status
      const actionStatus: 'success' | 'error' | 'cancelled' =
        result.status === 'success'
          ? 'success'
          : result.status === 'cancelled'
            ? 'cancelled'
            : 'error';

      return {
        status: actionStatus,
        message: `${statusMessage}: ${project.name}`,
        packageSyncResults: result.packageSyncResults,
      };
    } catch (error) {
      logger.error(
        error instanceof Error ? error : new Error(String(error)),
        `Failed to sync project ${project.name}: ${String(error)}`,
      );
      return {
        status: 'error' as const,
        message: `Failed to sync project ${project.name}: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
  writeCliOutput: (output) => {
    if (output.status === 'success') {
      console.info(`✓ ${output.message}`);
    } else if (output.status === 'cancelled') {
      console.info(`⚠ ${output.message}`);
    } else {
      console.error(`✗ ${output.message}`);
    }
  },
});
