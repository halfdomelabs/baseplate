import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';

const diffAllProjectsInputSchema = z.object({
  include: z
    .array(z.string())
    .optional()
    .describe('Filter files by glob patterns.'),
});

const changedFileSchema = z.object({
  packageName: z
    .string()
    .describe('The name of the package the file belongs to.'),
  path: z.string().describe('The package-relative path of the file.'),
  type: z
    .enum(['added', 'modified', 'deleted'])
    .describe('The type of difference for this file.'),
});

const projectDiffResultSchema = z.object({
  projectName: z.string().describe('The name of the project.'),
  status: z
    .enum(['success', 'error'])
    .describe('The status of the diff operation for this project.'),
  message: z.string().describe('Human-readable result message.'),
  totalDiffs: z
    .number()
    .optional()
    .describe('Total number of files with differences.'),
  changedFiles: z
    .array(changedFileSchema)
    .describe('The files with differences, if any.'),
});

const diffAllProjectsOutputSchema = z.object({
  overallStatus: z
    .enum(['success', 'differences-found', 'error'])
    .describe('The overall status of the diff operation across all projects.'),
  message: z.string().describe('Human-readable result summary.'),
  hasDifferences: z
    .boolean()
    .describe('Whether any differences were found across all projects.'),
  results: z
    .array(projectDiffResultSchema)
    .describe('Results for each individual project.'),
});

/**
 * Service action to diff all projects against their generated output.
 */
export const diffAllProjectsAction = createServiceAction({
  name: 'diff-all-projects',
  title: 'Diff All Projects',
  description: 'Diff all projects against what the sync engine would generate',
  inputSchema: diffAllProjectsInputSchema,
  outputSchema: diffAllProjectsOutputSchema,
  handler: async (input, context) => {
    const { include } = input;
    const { projects, logger } = context;

    logger.info(`Diffing ${projects.length} projects`);

    const { diffProject } = await import('../../diff/diff-project.js');

    const results: {
      projectName: string;
      status: 'success' | 'error';
      message: string;
      totalDiffs: number | undefined;
      changedFiles: {
        packageName: string;
        path: string;
        type: 'added' | 'modified' | 'deleted';
      }[];
    }[] = [];

    let errorCount = 0;
    let diffCount = 0;

    for (const project of projects) {
      logger.info(`Diffing project: ${project.name}`);

      try {
        const result = await diffProject({ project, include }, context);

        results.push({
          projectName: project.name,
          status: 'success',
          message: result.hasDifferences
            ? `Found differences in ${result.totalDiffs} file(s)`
            : 'No differences found',
          totalDiffs: result.totalDiffs,
          changedFiles: result.packageResults.flatMap((pkg) =>
            pkg.diffSummary.diffs.map((diff) => ({
              packageName: pkg.name,
              path: diff.path,
              type: diff.type,
            })),
          ),
        });

        if (result.hasDifferences) {
          diffCount++;
        }
      } catch (error) {
        logger.error(
          error instanceof Error ? error : new Error(String(error)),
          `Failed to diff project ${project.name}: ${String(error)}`,
        );

        results.push({
          projectName: project.name,
          status: 'error',
          message: `Failed to diff: ${error instanceof Error ? error.message : String(error)}`,
          totalDiffs: undefined,
          changedFiles: [],
        });

        errorCount++;
      }
    }

    let overallStatus: 'success' | 'differences-found' | 'error';
    let message: string;

    if (errorCount > 0) {
      overallStatus = 'error';
      message = `${errorCount} of ${projects.length} project(s) failed to diff`;
    } else if (diffCount > 0) {
      overallStatus = 'differences-found';
      message = `${diffCount} of ${projects.length} project(s) have uncommitted generated code differences`;
    } else {
      overallStatus = 'success';
      message = `All ${projects.length} projects are in sync with generators`;
    }

    logger.info(`Diff completed: ${message}`);

    return {
      overallStatus,
      message,
      hasDifferences: diffCount > 0 || errorCount > 0,
      results,
    };
  },
  writeCliOutput: (output) => {
    if (output.overallStatus === 'success') {
      console.info(`✓ ${output.message}`);
    } else {
      console.error(`✗ ${output.message}`);
    }

    console.info('\nProject Results:');
    for (const result of output.results) {
      const icon = result.status === 'success' ? '✓' : '✗';
      console.info(`  ${icon} ${result.projectName}: ${result.message}`);
      for (const file of result.changedFiles) {
        console.info(`      ${file.type} ${file.packageName}/${file.path}`);
      }
    }
  },
});
