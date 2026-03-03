import type { ProjectDefinition } from '@baseplate-dev/project-builder-lib';

import { getLatestMigrationVersion } from '@baseplate-dev/project-builder-lib';
import { stringifyPrettyStable } from '@baseplate-dev/utils';
import { dirExists } from '@baseplate-dev/utils/node';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';

import { createServiceAction } from '../types.js';

const projectTypeSchema = z
  .enum(['example', 'test'])
  .describe('The type of project to initialize.');

const initProjectInputSchema = z.object({
  projectDirectory: z
    .string()
    .describe(
      'Absolute path to the project directory (e.g. examples/<name>/ or tests/<name>/).',
    ),
  projectName: z
    .string()
    .describe('The name of the project (used as the project name).'),
  type: projectTypeSchema,
});

const initProjectOutputSchema = z.object({
  success: z.boolean().describe('Whether the initialization was successful.'),
  message: z.string().describe('Result message.'),
  definitionPath: z
    .string()
    .optional()
    .describe('Path to the created project definition.'),
});

/**
 * Service action to initialize a new example or test project with a default project definition.
 */
export const initProjectAction = createServiceAction({
  name: 'init-project',
  title: 'Initialize Project',
  description:
    'Create a new example or test project with an initial project definition',
  inputSchema: initProjectInputSchema,
  outputSchema: initProjectOutputSchema,
  handler: async (input, context) => {
    const { projectDirectory, projectName, type } = input;
    const { logger } = context;

    try {
      if (await dirExists(projectDirectory)) {
        return {
          success: false,
          message: `Project already exists at ${projectDirectory}.`,
        };
      }

      // Test projects: project-definition.json at root
      // Example projects: baseplate/project-definition.json
      const definitionDir =
        type === 'test'
          ? projectDirectory
          : path.join(projectDirectory, 'baseplate');

      await mkdir(definitionDir, { recursive: true });

      const definitionPath = path.join(
        definitionDir,
        'project-definition.json',
      );

      const initialDefinition = {
        settings: {
          general: {
            name: projectName,
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

      logger.info(`Created ${type} project at ${projectDirectory}`);

      return {
        success: true,
        message: `${type === 'test' ? 'Test' : 'Example'} project '${projectName}' initialized at ${projectDirectory}`,
        definitionPath,
      };
    } catch (error) {
      logger.error(`Failed to initialize project: ${String(error)}`);
      return {
        success: false,
        message: `Failed to initialize project: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
  writeCliOutput: (output) => {
    if (output.success) {
      console.info(`✓ ${output.message}`);
      if (output.definitionPath) {
        console.info(
          `  Next: Configure the project definition, then run 'baseplate-dev sync <project-name>'`,
        );
      }
    } else {
      console.error(`✗ ${output.message}`);
    }
  },
});
