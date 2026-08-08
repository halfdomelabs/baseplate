import { dirExists } from '@baseplate-dev/utils/node';

import { createServiceAction } from '#src/actions/types.js';
import { createNodeSchemaParserContext } from '#src/plugins/node-plugin-store.js';
import { SyncMetadataController } from '#src/sync/sync-metadata-controller.js';

import { writeGenerationManifest } from '../utils/generation-manifest.js';
import { getProjectByNameOrId } from '../utils/projects.js';
import { syncProjectMetadata } from './sync-project.action-metadata.js';

/**
 * Service action to sync a project.
 */
export const syncProjectAction = createServiceAction({
  ...syncProjectMetadata,
  handler: async (input, context) => {
    const {
      project: projectId,
      overwrite,
      skipCommands,
      baseplateDirectory,
      packages,
    } = input;
    const { projects, logger, plugins, userConfig, cliVersion } = context;

    // Find the project by name or ID
    const project = getProjectByNameOrId(projects, projectId);

    // Prevent overwrite on user projects to protect manual changes
    if (overwrite && project.type === 'user') {
      throw new Error(
        'Cannot use overwrite mode on user projects. Overwrite is only allowed for example and test projects.',
      );
    }

    logger.info(`Starting sync for project: ${project.name}`);

    // Resolve baseplate directory: explicit input overrides project default
    const resolvedBaseplateDir =
      baseplateDirectory ?? project.baseplateDirectory;

    // Auto-overwrite if output directory doesn't exist yet
    const outputDirExists = await dirExists(project.directory);
    const effectiveOverwrite = !!overwrite || !outputDirExists;

    try {
      // Create schema parser context
      // Use baseplateDirectory for plugin discovery when the output dir may not exist
      const schemaParserContext = await createNodeSchemaParserContext(
        project,
        logger,
        plugins,
        cliVersion,
        resolvedBaseplateDir,
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
        overwrite: effectiveOverwrite,
        skipCommands,
        baseplateDirectory: resolvedBaseplateDir,
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

      // Write generation manifest for test projects after overwrite sync
      if (
        result.status === 'success' &&
        effectiveOverwrite &&
        project.type === 'test'
      ) {
        await writeGenerationManifest(project.directory);
      }

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
