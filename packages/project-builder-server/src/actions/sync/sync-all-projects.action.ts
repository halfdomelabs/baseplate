import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';
import { createNodeSchemaParserContext } from '#src/plugins/node-plugin-store.js';
import { SyncMetadataController } from '#src/sync/sync-metadata-controller.js';

const syncAllProjectsInputSchema = z.object({
  overwrite: z
    .boolean()
    .optional()
    .describe('Whether to force overwrite existing files and apply snapshot.'),
  skipCommands: z
    .boolean()
    .optional()
    .describe('Whether to skip running commands.'),
});

const syncAllProjectsOutputSchema = z.object({
  overallStatus: z
    .enum(['success', 'partial', 'error'])
    .describe('The overall status of the sync operation across all projects.'),
  message: z.string().describe('Human-readable result summary.'),
  results: z
    .array(
      z.object({
        projectName: z.string().describe('The name of the project.'),
        status: z
          .enum(['success', 'error', 'cancelled'])
          .describe('The status of the sync operation for this project.'),
        message: z.string().describe('Human-readable result message.'),
      }),
    )
    .describe('Results for each individual project.'),
});

/**
 * Service action to sync all projects.
 */
export const syncAllProjectsAction = createServiceAction({
  name: 'sync-all-projects',
  title: 'Sync All Projects',
  description: 'Sync all available projects using the baseplate sync engine',
  inputSchema: syncAllProjectsInputSchema,
  outputSchema: syncAllProjectsOutputSchema,
  handler: async (input, context) => {
    const { overwrite, skipCommands } = input;
    const { projects, logger, plugins, userConfig, cliVersion } = context;

    logger.info(`Starting sync for ${projects.length} projects`);

    const results: {
      projectName: string;
      status: 'success' | 'error' | 'cancelled';
      message: string;
    }[] = [];

    let successCount = 0;
    let errorCount = 0;
    let cancelledCount = 0;

    // Sync each project
    for (const project of projects) {
      logger.info(`Syncing project: ${project.name}`);

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

        results.push({
          projectName: project.name,
          status: actionStatus,
          message: statusMessage,
        });

        if (actionStatus === 'success') {
          successCount++;
        } else if (actionStatus === 'cancelled') {
          cancelledCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        logger.error(
          `Failed to sync project ${project.name}: ${String(error)}`,
        );

        const errorMessage = `Failed to sync: ${error instanceof Error ? error.message : String(error)}`;

        results.push({
          projectName: project.name,
          status: 'error',
          message: errorMessage,
        });

        errorCount++;
      }
    }

    // Determine overall status
    let overallStatus: 'success' | 'partial' | 'error';
    let message: string;

    if (errorCount === 0 && cancelledCount === 0) {
      overallStatus = 'success';
      message = `All ${projects.length} projects synced successfully`;
    } else if (successCount > 0) {
      overallStatus = 'partial';
      message = `${successCount} of ${projects.length} projects synced successfully. ${errorCount} failed, ${cancelledCount} cancelled.`;
    } else {
      overallStatus = 'error';
      message = `All projects failed to sync. ${errorCount} failed, ${cancelledCount} cancelled.`;
    }

    logger.info(`Sync completed: ${message}`);

    return {
      overallStatus,
      message,
      results,
    };
  },
  writeCliOutput: (output) => {
    // Print summary
    if (output.overallStatus === 'success') {
      console.info(`✓ ${output.message}`);
    } else if (output.overallStatus === 'partial') {
      console.info(`⚠ ${output.message}`);
    } else {
      console.error(`✗ ${output.message}`);
    }

    // Print individual project results
    console.info('\nProject Results:');
    for (const result of output.results) {
      const icon =
        result.status === 'success'
          ? '✓'
          : result.status === 'cancelled'
            ? '⚠'
            : '✗';
      console.info(`  ${icon} ${result.projectName}: ${result.message}`);
    }
  },
});
