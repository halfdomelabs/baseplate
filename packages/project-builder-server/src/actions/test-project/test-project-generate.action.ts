import type { PluginMetadataWithPaths } from '@baseplate-dev/project-builder-lib';
import type { Logger } from '@baseplate-dev/sync';

import { dirExists } from '@baseplate-dev/utils/node';
import path from 'node:path';
import { z } from 'zod';

import type { BaseplateUserConfig } from '#src/user-config/user-config-schema.js';

import { createNodeSchemaParserContext } from '#src/plugins/node-plugin-store.js';
import { syncProject } from '#src/sync/sync-project.js';

import { createServiceAction } from '../types.js';
import { loadProjectFromDirectory } from '../utils/project-discovery.js';

/**
 * Generates a test project into the output directory by copying the project
 * definition from the test project directory and running syncProject with
 * baseplateDirectory pointing at the test project dir (so snapshots resolve
 * from testProjectDir/snapshots/<app>/).
 *
 * @param testProjectDir - Path to the test project directory (test-projects/<name>/)
 * @param outputDir - Path to the generated output directory (generated-tests/<name>/)
 * @param logger - Logger instance
 * @param plugins - Discovered plugin metadata
 * @param cliVersion - CLI version string
 * @param userConfig - User configuration
 * @param overwrite - Whether to overwrite existing files and apply snapshots (default: true)
 */
export async function generateTestProject(
  testProjectDir: string,
  outputDir: string,
  logger: Logger,
  plugins: PluginMetadataWithPaths[],
  cliVersion: string,
  userConfig: BaseplateUserConfig,
  overwrite = true,
): Promise<void> {
  // Load context — baseplateDirectory points at testProjectDir where project-definition.json lives
  const projectInfo = await loadProjectFromDirectory(outputDir, testProjectDir);

  const context = await createNodeSchemaParserContext(
    projectInfo,
    logger,
    plugins,
    cliVersion,
    testProjectDir,
  );

  // Sync with baseplateDirectory pointing at the test project dir
  // so snapshots resolve from testProjectDir/snapshots/<app>/
  const outputDirExists = await dirExists(outputDir);
  const result = await syncProject({
    directory: outputDir,
    logger,
    context,
    userConfig,
    overwrite: overwrite || !outputDirExists,
    baseplateDirectory: testProjectDir,
  });

  if (result.status === 'error') {
    throw new Error(
      `Test project generation failed for ${path.basename(testProjectDir)}`,
    );
  }
}

const testProjectGenerateInputSchema = z.object({
  testProjectDirectory: z
    .string()
    .describe(
      'Absolute path to the test project directory (e.g. test-projects/<name>/).',
    ),
  outputDirectory: z
    .string()
    .describe(
      'Absolute path to the generated output directory (e.g. generated-tests/<name>/).',
    ),
  overwrite: z
    .boolean()
    .optional()
    .describe(
      'Whether to overwrite existing files and apply snapshots. Always true if first generation.',
    ),
});

const testProjectGenerateOutputSchema = z.object({
  success: z.boolean().describe('Whether the generation was successful.'),
  message: z.string().describe('Result message.'),
});

/**
 * Service action to generate a test project from its definition and snapshots.
 */
export const testProjectGenerateAction = createServiceAction({
  name: 'test-project-generate',
  title: 'Generate Test Project',
  description:
    'Generate test project output from a test project definition and snapshots',
  inputSchema: testProjectGenerateInputSchema,
  outputSchema: testProjectGenerateOutputSchema,
  handler: async (input, context) => {
    const { testProjectDirectory, outputDirectory, overwrite = true } = input;
    const { logger, plugins, cliVersion, userConfig } = context;

    try {
      await generateTestProject(
        testProjectDirectory,
        outputDirectory,
        logger,
        plugins,
        cliVersion,
        userConfig,
        overwrite,
      );

      return {
        success: true,
        message: `Test project generated at ${outputDirectory}`,
      };
    } catch (error) {
      logger.error(`Failed to generate test project: ${String(error)}`);
      return {
        success: false,
        message: `Failed to generate test project: ${error instanceof Error ? error.message : String(error)}`,
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
