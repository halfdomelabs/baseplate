import { createServiceAction } from '#src/actions/types.js';
import { createNodeSchemaParserContext } from '#src/plugins/node-plugin-store.js';

import { getProjectByNameOrId } from '../utils/projects.js';
import { snapshotRemoveMetadata } from './snapshot-remove.action-metadata.js';

/**
 * Service action to remove files from a project snapshot.
 */
export const snapshotRemoveAction = createServiceAction({
  ...snapshotRemoveMetadata,
  handler: async (input, context) => {
    const { project: projectId, app, files } = input;
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
        project.baseplateDirectory,
      );

      const { removeFilesFromSnapshot } =
        await import('#src/diff/snapshot/snapshot-management.js');

      await removeFilesFromSnapshot(files, {
        projectDirectory: project.directory,
        baseplateDirectory: project.baseplateDirectory,
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
