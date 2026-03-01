import type { PluginMetadataWithPaths } from '@baseplate-dev/project-builder-lib';
import type { Logger } from '@baseplate-dev/sync';

import { cp, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';

import type { BaseplateUserConfig } from '#src/user-config/user-config-schema.js';

import { DEFAULT_SNAPSHOTS_DIR } from '#src/diff/snapshot/snapshot-types.js';

import { createServiceAction } from '../types.js';
import { loadTestCaseContext } from './test-case-generate.action.js';
import { resolveTestCaseSnapshotDirectory } from './test-case-paths.js';

/**
 * Saves the current state of the generated output directory as snapshots
 * back into the test case directory.
 *
 * Requires the output directory to exist (run `expandTestCase` first).
 *
 * @param testCaseDir - Path to the test case directory (tests/<name>/)
 * @param outputDir - Path to the generated output directory (generated-tests/<name>/)
 * @param logger - Logger instance
 * @param plugins - Discovered plugin metadata
 * @param cliVersion - CLI version string
 * @param userConfig - User configuration
 */
export async function saveTestCaseSnapshots(
  testCaseDir: string,
  outputDir: string,
  logger: Logger,
  plugins: PluginMetadataWithPaths[],
  cliVersion: string,
  userConfig: BaseplateUserConfig,
): Promise<string[]> {
  const { context } = await loadTestCaseContext(
    outputDir,
    logger,
    plugins,
    cliVersion,
  );

  const { createSnapshotForProject } =
    await import('#src/diff/snapshot/create-snapshot-for-project.js');

  // Save snapshots for all apps at once (with content for added files since test cases aren't committed)
  const savedApps = await createSnapshotForProject({
    projectDirectory: outputDir,
    logger,
    context,
    userConfig,
    includeAddedFileContents: true,
  });

  // Copy snapshots back from output dir to test case dir
  for (const appName of savedApps) {
    const sourceSnapshotDir = path.join(
      outputDir,
      DEFAULT_SNAPSHOTS_DIR,
      appName,
    );
    const destSnapshotDir = resolveTestCaseSnapshotDirectory(
      testCaseDir,
      appName,
    );
    await mkdir(path.dirname(destSnapshotDir), { recursive: true });
    await cp(sourceSnapshotDir, destSnapshotDir, { recursive: true });
  }

  return savedApps;
}

const testCaseSaveInputSchema = z.object({
  testCaseDirectory: z
    .string()
    .describe(
      'Absolute path to the test case directory (e.g. tests/<test-name>/).',
    ),
  outputDirectory: z
    .string()
    .describe(
      'Absolute path to the generated output directory (e.g. generated-tests/<test-name>/).',
    ),
});

const testCaseSaveOutputSchema = z.object({
  success: z.boolean().describe('Whether the save was successful.'),
  message: z.string().describe('Result message.'),
  apps: z.array(z.string()).describe('App names that had snapshots saved.'),
});

/**
 * Service action to save snapshots from generated output back to the test case directory.
 */
export const testCaseSaveAction = createServiceAction({
  name: 'test-case-save',
  title: 'Save Test Case Snapshots',
  description:
    'Save snapshots from generated output back to test case directory',
  inputSchema: testCaseSaveInputSchema,
  outputSchema: testCaseSaveOutputSchema,
  handler: async (input, context) => {
    const { testCaseDirectory, outputDirectory } = input;
    const { logger, plugins, cliVersion, userConfig } = context;

    try {
      const apps = await saveTestCaseSnapshots(
        testCaseDirectory,
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
      logger.error(`Failed to save test case snapshots: ${String(error)}`);
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
