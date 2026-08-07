import { z } from 'zod';

import { createServiceActionMetadata } from '#src/actions/types.js';

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

export const initProjectMetadata = createServiceActionMetadata({
  name: 'init-project',
  title: 'Initialize Project',
  description:
    'Create a new example or test project with an initial project definition',
  inputSchema: initProjectInputSchema,
  outputSchema: initProjectOutputSchema,
  scope: 'dev',
});
