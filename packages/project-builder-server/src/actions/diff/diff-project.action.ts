import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';

import { getProjectByNameOrId } from '../utils/projects.js';

const diffProjectInputSchema = z.object({
  project: z.string().describe('The name or ID of the project to diff.'),
  compact: z
    .boolean()
    .optional()
    .describe('Whether to show compact diff format.'),
  packages: z
    .array(z.string())
    .optional()
    .describe('Only show diffs for specific packages.'),
  include: z
    .array(z.string())
    .optional()
    .describe('Filter files by glob patterns.'),
});

const packageDiffResultSchema = z.object({
  name: z.string().describe('The name of the package.'),
  packageDirectory: z.string().describe('The directory of the package.'),
  diffSummary: z.object({
    totalFiles: z.number().describe('The diff summary for this package.'),
    files: z.array(
      z.object({
        path: z.string(),
        status: z.enum(['modified', 'added', 'deleted']),
        diff: z.string().optional(),
      }),
    ),
  }),
  hasDifferences: z.boolean().describe('Whether differences were found.'),
});

const diffProjectOutputSchema = z.object({
  packageResults: z.array(packageDiffResultSchema),
  totalDiffs: z.number().describe('Total number of files with differences.'),
  hasDifferences: z
    .boolean()
    .describe('Whether any differences were found across all applications.'),
});

/**
 * Service action to generate a diff between what would be generated and what currently exists.
 */
export const diffProjectAction = createServiceAction({
  name: 'diff-project',
  title: 'Diff Project',
  description:
    'Generate a diff between what would be generated and what currently exists in the working directory',
  inputSchema: diffProjectInputSchema,
  outputSchema: diffProjectOutputSchema,
  handler: async (input, context) => {
    const { project: projectId, packages, include, compact } = input;
    const { projects, logger } = context;

    // Find the project by name
    const project = getProjectByNameOrId(projects, projectId);

    logger.info(`Generating diff for project: ${project.name}`);

    const { diffProject } = await import('../../diff/diff-project.js');

    const result = await diffProject(
      {
        project,
        packageFilter: packages,
        include,
      },
      context,
    );

    // Transform to simplified format
    return {
      packageResults: result.packageResults.map((pkg) => ({
        name: pkg.name,
        packageDirectory: pkg.packageDirectory,
        diffSummary: {
          totalFiles: pkg.diffSummary.totalFiles,
          files: pkg.diffSummary.diffs.map((diff) => ({
            path: diff.path,
            status: diff.type,
            // Only include diff for modified text files when not in compact mode
            diff:
              !compact && diff.type === 'modified' && !diff.isBinary
                ? diff.unifiedDiff
                : undefined,
          })),
        },
        hasDifferences: pkg.hasDifferences,
      })),
      totalDiffs: result.totalDiffs,
      hasDifferences: result.hasDifferences,
    };
  },
  writeCliOutput: (output) => {
    if (!output.hasDifferences) {
      console.info('✓ No differences found across all packages');
      return;
    }

    console.info(
      `Found differences in ${output.totalDiffs} file(s) across ${output.packageResults.length} package(s):`,
    );

    for (const packageResult of output.packageResults) {
      if (packageResult.hasDifferences) {
        console.info(
          `\n=== ${packageResult.name} (${packageResult.packageDirectory}) ===`,
        );
        console.info(
          `  Files with differences: ${packageResult.diffSummary.totalFiles}`,
        );

        for (const file of packageResult.diffSummary.files) {
          console.info(`\n  ${file.status.toUpperCase()}: ${file.path}`);

          // Show diff content if available
          if (file.diff) {
            console.info(file.diff);
          }
        }
      }
    }
  },
});
