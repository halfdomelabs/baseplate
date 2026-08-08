import { z } from 'zod';

import { createServiceActionMetadata } from '#src/actions/types.js';

const discoverGeneratorsInputSchema = z.object({
  project: z
    .string()
    .optional()
    .describe(
      'Optionally, specify the project to discover generators from. If not provided, uses current directory.',
    ),
});
const generatorInfoSchema = z.object({
  name: z.string().describe('The generator name'),
  packageName: z.string().describe('The generator package name'),
  packagePath: z.string().describe('The file system path to the package'),
  generatorDirectory: z.string().describe('The generator directory path'),
  templateCount: z.number().describe('Number of templates in the generator'),
});
const discoverGeneratorsOutputSchema = z.object({
  generators: z
    .array(generatorInfoSchema)
    .describe('List of discovered generators with their template information'),
});

export const discoverGeneratorsMetadata = createServiceActionMetadata({
  name: 'discover-generators',
  title: 'Discover Generators',
  description: 'Discover all available generators with extractor.json files',
  inputSchema: discoverGeneratorsInputSchema,
  outputSchema: discoverGeneratorsOutputSchema,
  scope: 'dev',
});
