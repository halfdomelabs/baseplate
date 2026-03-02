import type {
  PluginMetadataWithPaths,
  SchemaParserContext,
} from '@baseplate-dev/project-builder-lib';
import type { Logger } from '@baseplate-dev/sync';

import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';

import type { PackageEntry } from '#src/compiler/package-entry.js';
import type { BaseplateUserConfig } from '#src/user-config/user-config-schema.js';

import { compilePackages } from '#src/compiler/compile-packages.js';
import { DEFAULT_SNAPSHOTS_DIR } from '#src/diff/snapshot/snapshot-types.js';
import { createNodeSchemaParserContext } from '#src/plugins/node-plugin-store.js';
import { loadProjectDefinition } from '#src/project-definition/load-project-definition.js';
import { syncProject } from '#src/sync/sync-project.js';

import { createServiceAction } from '../types.js';
import { loadProjectFromDirectory } from '../utils/project-discovery.js';
import {
  resolveTestCaseSnapshotDirectory,
  TEST_CASE_DEFINITION_FILENAME,
} from './test-case-paths.js';

export interface TestCaseContext {
  context: SchemaParserContext;
  apps: PackageEntry[];
}

/**
 * Loads the schema parser context and compiled package entries for a test case
 * output directory. Requires `outputDir/baseplate/project-definition.json` to exist.
 */
export async function loadTestCaseContext(
  outputDir: string,
  logger: Logger,
  plugins: PluginMetadataWithPaths[],
  cliVersion: string,
): Promise<TestCaseContext> {
  const projectInfo = await loadProjectFromDirectory(outputDir);
  const context = await createNodeSchemaParserContext(
    projectInfo,
    logger,
    plugins,
    cliVersion,
  );

  const { definition } = await loadProjectDefinition(outputDir, context);
  const apps = compilePackages(definition, context);

  return { context, apps };
}

/**
 * Sets up the generated test output directory by copying the project definition
 * and per-app snapshots from the test case directory.
 */
async function setupGeneratedTestDirectory(
  testCaseDir: string,
  outputDir: string,
  logger: Logger,
  plugins: PluginMetadataWithPaths[],
  cliVersion: string,
): Promise<TestCaseContext> {
  // Copy project definition to output dir
  await mkdir(path.join(outputDir, 'baseplate'), { recursive: true });
  await writeFile(
    path.join(outputDir, 'baseplate', TEST_CASE_DEFINITION_FILENAME),
    await readFile(
      path.join(testCaseDir, TEST_CASE_DEFINITION_FILENAME),
      'utf-8',
    ),
  );

  // Load context + apps to know packageDirectory for each app
  const testCaseContext = await loadTestCaseContext(
    outputDir,
    logger,
    plugins,
    cliVersion,
  );
  const { apps } = testCaseContext;

  // Copy per-app snapshots from testCaseDir/snapshots/<appName>/ → outputDir/baseplate/snapshots/<appName>/
  await Promise.all(
    apps.map(async (app) => {
      const sourceSnapshotDir = resolveTestCaseSnapshotDirectory(
        testCaseDir,
        app.name,
      );
      const destSnapshotDir = path.join(
        outputDir,
        DEFAULT_SNAPSHOTS_DIR,
        app.name,
      );
      try {
        await cp(sourceSnapshotDir, destSnapshotDir, { recursive: true });
      } catch (error) {
        // Source snapshot doesn't exist — skip (empty snapshot is fine)
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
      }
    }),
  );

  return testCaseContext;
}

/**
 * Expands a test case into the output directory by generating the project
 * and applying per-app snapshots.
 *
 * @param testCaseDir - Path to the test case directory (tests/<name>/)
 * @param outputDir - Path to the generated output directory (generated-tests/<name>/)
 * @param logger - Logger instance
 * @param plugins - Discovered plugin metadata
 * @param cliVersion - CLI version string
 * @param userConfig - User configuration
 */
export async function expandTestCase(
  testCaseDir: string,
  outputDir: string,
  logger: Logger,
  plugins: PluginMetadataWithPaths[],
  cliVersion: string,
  userConfig: BaseplateUserConfig,
): Promise<void> {
  const { context } = await setupGeneratedTestDirectory(
    testCaseDir,
    outputDir,
    logger,
    plugins,
    cliVersion,
  );

  const result = await syncProject({
    directory: outputDir,
    logger,
    context,
    userConfig,
    overwrite: true,
  });

  if (result.status === 'error') {
    throw new Error(
      `Test case generation failed for ${path.basename(testCaseDir)}`,
    );
  }
}

const testCaseGenerateInputSchema = z.object({
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

const testCaseGenerateOutputSchema = z.object({
  success: z.boolean().describe('Whether the generation was successful.'),
  message: z.string().describe('Result message.'),
});

/**
 * Service action to generate a test case from its definition and snapshots.
 */
export const testCaseGenerateAction = createServiceAction({
  name: 'test-case-generate',
  title: 'Generate Test Case',
  description:
    'Generate test case output from a test case definition and snapshots',
  inputSchema: testCaseGenerateInputSchema,
  outputSchema: testCaseGenerateOutputSchema,
  handler: async (input, context) => {
    const { testCaseDirectory, outputDirectory } = input;
    const { logger, plugins, cliVersion, userConfig } = context;

    try {
      await expandTestCase(
        testCaseDirectory,
        outputDirectory,
        logger,
        plugins,
        cliVersion,
        userConfig,
      );

      return {
        success: true,
        message: `Test case generated at ${outputDirectory}`,
      };
    } catch (error) {
      logger.error(`Failed to generate test case: ${String(error)}`);
      return {
        success: false,
        message: `Failed to generate test case: ${error instanceof Error ? error.message : String(error)}`,
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
