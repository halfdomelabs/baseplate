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
  resolveTestProjectSnapshotDirectory,
  TEST_PROJECT_DEFINITION_FILENAME,
} from './test-project-paths.js';

export interface TestProjectContext {
  context: SchemaParserContext;
  apps: PackageEntry[];
}

/**
 * Loads the schema parser context and compiled package entries for a test project
 * output directory. Requires `outputDir/baseplate/project-definition.json` to exist.
 */
export async function loadTestProjectContext(
  outputDir: string,
  logger: Logger,
  plugins: PluginMetadataWithPaths[],
  cliVersion: string,
): Promise<TestProjectContext> {
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
 * and per-app snapshots from the test project directory.
 */
async function setupGeneratedTestDirectory(
  testProjectDir: string,
  outputDir: string,
  logger: Logger,
  plugins: PluginMetadataWithPaths[],
  cliVersion: string,
): Promise<TestProjectContext> {
  // Copy project definition to output dir
  await mkdir(path.join(outputDir, 'baseplate'), { recursive: true });
  await writeFile(
    path.join(outputDir, 'baseplate', TEST_PROJECT_DEFINITION_FILENAME),
    await readFile(
      path.join(testProjectDir, TEST_PROJECT_DEFINITION_FILENAME),
      'utf-8',
    ),
  );

  // Load context + apps to know packageDirectory for each app
  const testProjectContext = await loadTestProjectContext(
    outputDir,
    logger,
    plugins,
    cliVersion,
  );
  const { apps } = testProjectContext;

  // Copy per-app snapshots from testProjectDir/snapshots/<appName>/ → outputDir/baseplate/snapshots/<appName>/
  await Promise.all(
    apps.map(async (app) => {
      const sourceSnapshotDir = resolveTestProjectSnapshotDirectory(
        testProjectDir,
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

  return testProjectContext;
}

/**
 * Expands a test project into the output directory by generating the project
 * and applying per-app snapshots.
 *
 * @param testProjectDir - Path to the test project directory (test-projects/<name>/)
 * @param outputDir - Path to the generated output directory (generated-tests/<name>/)
 * @param logger - Logger instance
 * @param plugins - Discovered plugin metadata
 * @param cliVersion - CLI version string
 * @param userConfig - User configuration
 */
export async function expandTestProject(
  testProjectDir: string,
  outputDir: string,
  logger: Logger,
  plugins: PluginMetadataWithPaths[],
  cliVersion: string,
  userConfig: BaseplateUserConfig,
): Promise<void> {
  const { context } = await setupGeneratedTestDirectory(
    testProjectDir,
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
    const { testProjectDirectory, outputDirectory } = input;
    const { logger, plugins, cliVersion, userConfig } = context;

    try {
      await expandTestProject(
        testProjectDirectory,
        outputDirectory,
        logger,
        plugins,
        cliVersion,
        userConfig,
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
