import type {
  PluginMetadataWithPaths,
  SchemaParserContext,
} from '@baseplate-dev/project-builder-lib';
import type { Logger } from '@baseplate-dev/sync';

import { z } from 'zod';

import type { PackageEntry } from '#src/compiler/package-entry.js';
import type { BaseplateUserConfig } from '#src/user-config/user-config-schema.js';

import { compilePackages } from '#src/compiler/compile-packages.js';
import { createNodeSchemaParserContext } from '#src/plugins/node-plugin-store.js';
import { loadProjectDefinition } from '#src/project-definition/load-project-definition.js';

import { createServiceAction } from '../types.js';
import { loadProjectFromDirectory } from '../utils/project-discovery.js';

interface TestProjectContext {
  context: SchemaParserContext;
  apps: PackageEntry[];
}

/**
 * Loads the schema parser context and compiled package entries for a test project
 * output directory. Requires `outputDir/baseplate/project-definition.json` to exist.
 */
async function loadTestProjectContext(
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
 * Saves the current state of the generated output directory as snapshots
 * directly into the test project directory.
 *
 * Requires the output directory to exist (run `generateTestProject` first).
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

  // Save snapshots directly to testProjectDir/snapshots/<app>/
  // by setting baseplateDirectory to testProjectDir
  const savedApps = await createSnapshotForProject({
    projectDirectory: outputDir,
    logger,
    context,
    userConfig,
    includeAddedFileContents: true,
    baseplateDirectory: testProjectDir,
  });

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
