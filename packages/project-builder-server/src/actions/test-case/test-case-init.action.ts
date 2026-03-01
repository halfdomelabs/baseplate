import type { ProjectDefinition } from '@baseplate-dev/project-builder-lib';

import { getLatestMigrationVersion } from '@baseplate-dev/project-builder-lib';
import { stringifyPrettyStable } from '@baseplate-dev/utils';
import { dirExists } from '@baseplate-dev/utils/node';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';

import { createServiceAction } from '../types.js';
import { TEST_CASE_DEFINITION_FILENAME } from './test-case-paths.js';

const testCaseInitInputSchema = z.object({
  testCaseDirectory: z
    .string()
    .describe(
      'Absolute path to the test case directory (e.g. tests/<test-name>/).',
    ),
  testName: z
    .string()
    .describe('The name of the test case (used as the project name).'),
});

const testCaseInitOutputSchema = z.object({
  success: z.boolean().describe('Whether the initialization was successful.'),
  message: z.string().describe('Result message.'),
  definitionPath: z
    .string()
    .optional()
    .describe('Path to the created project definition.'),
});

/**
 * Service action to initialize a new test case with a default project definition.
 */
export const testCaseInitAction = createServiceAction({
  name: 'test-case-init',
  title: 'Initialize Test Case',
  description: 'Create a new test case with an initial project definition',
  inputSchema: testCaseInitInputSchema,
  outputSchema: testCaseInitOutputSchema,
  handler: async (input, context) => {
    const { testCaseDirectory, testName } = input;
    const { logger } = context;

    try {
      if (await dirExists(testCaseDirectory)) {
        return {
          success: false,
          message: `Test case already exists at ${testCaseDirectory}. Use 'test-case-generate' to regenerate it.`,
        };
      }

      await mkdir(testCaseDirectory, { recursive: true });

      const definitionPath = path.join(
        testCaseDirectory,
        TEST_CASE_DEFINITION_FILENAME,
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

      logger.info(`Created test case at ${testCaseDirectory}`);

      return {
        success: true,
        message: `Test case '${testName}' initialized at ${testCaseDirectory}`,
        definitionPath,
      };
    } catch (error) {
      logger.error(`Failed to initialize test case: ${String(error)}`);
      return {
        success: false,
        message: `Failed to initialize test case: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
  writeCliOutput: (output) => {
    if (output.success) {
      console.info(`✓ ${output.message}`);
      if (output.definitionPath) {
        console.info(
          `  Next: Configure the project definition, then run 'baseplate-dev test generate <test-name>'`,
        );
      }
    } else {
      console.error(`✗ ${output.message}`);
    }
  },
});
