import type { ProjectDefinition } from '@baseplate-dev/project-builder-lib';

import { getLatestMigrationVersion } from '@baseplate-dev/project-builder-lib';
import { stringifyPrettyStable } from '@baseplate-dev/utils';
import { dirExists } from '@baseplate-dev/utils/node';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';

import { createServiceAction } from '../types.js';
import { TEST_PROJECT_DEFINITION_FILENAME } from './test-project-paths.js';

const testProjectInitInputSchema = z.object({
  testProjectDirectory: z
    .string()
    .describe(
      'Absolute path to the test project directory (e.g. test-projects/<name>/).',
    ),
  testName: z
    .string()
    .describe('The name of the test project (used as the project name).'),
});

const testProjectInitOutputSchema = z.object({
  success: z.boolean().describe('Whether the initialization was successful.'),
  message: z.string().describe('Result message.'),
  definitionPath: z
    .string()
    .optional()
    .describe('Path to the created project definition.'),
});

/**
 * Service action to initialize a new test project with a default project definition.
 */
export const testProjectInitAction = createServiceAction({
  name: 'test-project-init',
  title: 'Initialize Test Project',
  description: 'Create a new test project with an initial project definition',
  inputSchema: testProjectInitInputSchema,
  outputSchema: testProjectInitOutputSchema,
  handler: async (input, context) => {
    const { testProjectDirectory, testName } = input;
    const { logger } = context;

    try {
      if (await dirExists(testProjectDirectory)) {
        return {
          success: false,
          message: `Test project already exists at ${testProjectDirectory}. Use 'test-project generate' to regenerate it.`,
        };
      }

      await mkdir(testProjectDirectory, { recursive: true });

      const definitionPath = path.join(
        testProjectDirectory,
        TEST_PROJECT_DEFINITION_FILENAME,
      );

      const initialDefinition = {
        settings: {
          general: {
            name: testName,
            packageScope: '',
            portOffset: 3000,
          },
        },
        features: [],
        apps: [],
        libraries: [],
        models: [],
        isInitialized: false,
        schemaVersion: getLatestMigrationVersion(),
      } satisfies ProjectDefinition;

      await writeFile(definitionPath, stringifyPrettyStable(initialDefinition));

      logger.info(`Created test project at ${testProjectDirectory}`);

      return {
        success: true,
        message: `Test project '${testName}' initialized at ${testProjectDirectory}`,
        definitionPath,
      };
    } catch (error) {
      logger.error(`Failed to initialize test project: ${String(error)}`);
      return {
        success: false,
        message: `Failed to initialize test project: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
  writeCliOutput: (output) => {
    if (output.success) {
      console.info(`✓ ${output.message}`);
      if (output.definitionPath) {
        console.info(
          `  Next: Configure the project definition, then run 'baseplate-dev test-project generate <test-name>'`,
        );
      }
    } else {
      console.error(`✗ ${output.message}`);
    }
  },
});
