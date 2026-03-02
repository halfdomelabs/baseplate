import type { PluginMetadataWithPaths } from '@baseplate-dev/project-builder-lib';
import type { Logger } from '@baseplate-dev/sync';

import { cp, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';

import type { BaseplateUserConfig } from '#src/user-config/user-config-schema.js';

import { DEFAULT_SNAPSHOTS_DIR } from '#src/diff/snapshot/snapshot-types.js';

import { createServiceAction } from '../types.js';
import { loadTestProjectContext } from './test-project-generate.action.js';
import { resolveTestProjectSnapshotDirectory } from './test-project-paths.js';

/**
 * Saves the current state of the generated output directory as snapshots
 * back into the test project directory.
 *
 * Requires the output directory to exist (run `expandTestProject` first).
 *
 * @param testProjectDir - Path to the test project directory (test-projects/<name>/)
 * @param outputDir - Path to the generated output directory (generated-tests/<name>/)
 * @param logger - Logger instance
 * @param plugins - Discovered plugin metadata
 * @param cliVersion - CLI version string
 * @param userConfig - User configuration
 */
export async function saveTestProjectSnapshots(
  testProjectDir: string,
  outputDir: string,
  logger: Logger,
  plugins: PluginMetadataWithPaths[],
  cliVersion: string,
  userConfig: BaseplateUserConfig,
): Promise<string[]> {
  const { context } = await loadTestProjectContext(
    outputDir,
    logger,
    plugins,
    cliVersion,
  );

  const { createSnapshotForProject } =
    await import('#src/diff/snapshot/create-snapshot-for-project.js');

  // Save snapshots for all apps at once (with content for added files since test projects aren't committed)
  const savedApps = await createSnapshotForProject({
    projectDirectory: outputDir,
    logger,
    context,
    userConfig,
    includeAddedFileContents: true,
  });

  // Copy snapshots back from output dir to test project dir
  for (const appName of savedApps) {
    const sourceSnapshotDir = path.join(
      outputDir,
      DEFAULT_SNAPSHOTS_DIR,
      appName,
    );
    const destSnapshotDir = resolveTestProjectSnapshotDirectory(
      testProjectDir,
      appName,
    );
    await mkdir(path.dirname(destSnapshotDir), { recursive: true });
    await cp(sourceSnapshotDir, destSnapshotDir, { recursive: true });
  }

  return savedApps;
}

const testProjectSaveInputSchema = z.object({
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
});

const testProjectSaveOutputSchema = z.object({
  success: z.boolean().describe('Whether the save was successful.'),
  message: z.string().describe('Result message.'),
  apps: z.array(z.string()).describe('App names that had snapshots saved.'),
});

/**
 * Service action to save snapshots from generated output back to the test project directory.
 */
export const testProjectSaveAction = createServiceAction({
  name: 'test-project-save',
  title: 'Save Test Project Snapshots',
  description:
    'Save snapshots from generated output back to test project directory',
  inputSchema: testProjectSaveInputSchema,
  outputSchema: testProjectSaveOutputSchema,
  handler: async (input, context) => {
    const { testProjectDirectory, outputDirectory } = input;
    const { logger, plugins, cliVersion, userConfig } = context;

    try {
      const apps = await saveTestProjectSnapshots(
        testProjectDirectory,
        outputDirectory,
        logger,
        plugins,
        cliVersion,
        userConfig,
      );

      return {
        success: true,
        message: `Snapshots saved for ${apps.length} app(s)`,
        apps,
      };
    } catch (error) {
      logger.error(`Failed to save test project snapshots: ${String(error)}`);
      return {
        success: false,
        message: `Failed to save snapshots: ${error instanceof Error ? error.message : String(error)}`,
        apps: [],
      };
    }
  },
  writeCliOutput: (output) => {
    if (output.success) {
      console.info(`✓ ${output.message}`);
      for (const app of output.apps) {
        console.info(`   Saved: ${app}`);
      }
    } else {
      console.error(`✗ ${output.message}`);
    }
  },
});
