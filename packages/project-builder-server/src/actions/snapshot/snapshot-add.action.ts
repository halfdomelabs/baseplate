import { createServiceAction } from '#src/actions/types.js';
import { createNodeSchemaParserContext } from '#src/plugins/node-plugin-store.js';

import { getProjectByNameOrId } from '../utils/projects.js';
import { snapshotAddMetadata } from './snapshot-add.action-metadata.js';

/**
 * Service action to add files to a project snapshot.
 */
export const snapshotAddAction = createServiceAction({
  ...snapshotAddMetadata,
  handler: async (input, context) => {
    const { project: projectId, app, files, deleted = false } = input;
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
        project.baseplateDirectory,
      );

      const { addFilesToSnapshot } =
        await import('#src/diff/snapshot/snapshot-management.js');

      await addFilesToSnapshot(files, deleted, {
        projectDirectory: project.directory,
        baseplateDirectory: project.baseplateDirectory,
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
