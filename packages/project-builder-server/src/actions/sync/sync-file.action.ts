import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';
import { compilePackages } from '#src/compiler/index.js';
import { createNodeSchemaParserContext } from '#src/plugins/node-plugin-store.js';
import { loadProjectDefinition } from '#src/project-definition/load-project-definition.js';
import { syncFile } from '#src/sync/sync-file.js';
import { createTemplateMetadataOptions } from '#src/sync/template-metadata-utils.js';

import { getProjectByNameOrId } from '../utils/projects.js';

const syncFileInputSchema = z.object({
  project: z.string().describe('The name or ID of the project.'),
  app: z.string().describe('The app name within the project.'),
  files: z
    .array(z.string())
    .describe(
      'Array of glob patterns to match files to sync (e.g., "src/routes/**/*.ts").',
    ),
});

const syncFileOutputSchema = z.object({
  success: z.boolean().describe('Whether the operation was successful.'),
  message: z.string().describe('Result message.'),
  filesApplied: z
    .array(z.string())
    .describe('List of files that were successfully applied.'),
  errors: z.array(z.string()).describe('List of errors encountered.'),
});

/**
 * Service action to sync specific files from generator output.
 *
 * Unlike full sync, this command:
 * - Runs generators and filters files by glob
 * - Writes matching files directly to working directory AND generated folder
 * - Does NOT perform the full generated folder swap
 * - Allows incremental fixing of generators one file at a time
 */
export const syncFileAction = createServiceAction({
  name: 'sync-file',
  title: 'Sync Specific Files',
  description:
    'Apply specific generated files to the working codebase without performing a full sync',
  inputSchema: syncFileInputSchema,
  outputSchema: syncFileOutputSchema,
  handler: async (input, context) => {
    const { project: projectId, app: appName, files: fileGlobs } = input;
    const { projects, logger, plugins, cliVersion } = context;

    try {
      // Find the project by name or ID
      const project = getProjectByNameOrId(projects, projectId);

      logger.info(
        `Syncing files for project: ${project.name}, app: ${appName}`,
      );
      logger.info(`File globs: ${fileGlobs.join(', ')}`);

      // Create schema parser context
      const schemaContext = await createNodeSchemaParserContext(
        project,
        logger,
        plugins,
        cliVersion,
      );

      // Load project definition and compile packages
      const { definition: projectJson } = await loadProjectDefinition(
        project.directory,
        schemaContext,
      );
      const apps = compilePackages(projectJson, schemaContext);

      // Find the app by name
      const appEntry = apps.find((a) => a.name === appName);
      if (!appEntry) {
        throw new Error(
          `App "${appName}" not found. Available apps: ${apps.map((a) => a.name).join(', ')}`,
        );
      }

      const result = await syncFile({
        baseDirectory: project.directory,
        appEntry,
        logger,
        fileGlobs,
        writeTemplateMetadataOptions:
          createTemplateMetadataOptions(projectJson),
      });

      const success = result.errors.length === 0;
      const message = success
        ? `Successfully applied ${result.filesApplied.length} file(s)`
        : `Applied ${result.filesApplied.length} file(s) with ${result.errors.length} error(s)`;

      return {
        success,
        message,
        filesApplied: result.filesApplied,
        errors: result.errors,
      };
    } catch (error) {
      logger.error(
        error instanceof Error ? error : new Error(String(error)),
        `Failed to sync files for project ${projectId}: ${String(error)}`,
      );
      return {
        success: false,
        message: `Failed to sync files: ${error instanceof Error ? error.message : String(error)}`,
        filesApplied: [],
        errors: [String(error)],
      };
    }
  },
  writeCliOutput: (output) => {
    if (output.success) {
      console.info(`✓ ${output.message}`);
      if (output.filesApplied.length > 0) {
        console.info('Files applied:');
        for (const file of output.filesApplied) {
          console.info(`  - ${file}`);
        }
      }
    } else {
      console.error(`✗ ${output.message}`);
      if (output.errors.length > 0) {
        console.error('Errors:');
        for (const error of output.errors) {
          console.error(`  - ${error}`);
        }
      }
    }
  },
});
