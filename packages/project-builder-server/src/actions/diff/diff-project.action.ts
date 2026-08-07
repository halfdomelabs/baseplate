import chalk from 'chalk';

import { createServiceAction } from '#src/actions/types.js';
import { formatCompactDiff, formatUnifiedDiff } from '#src/diff/formatters.js';

import { getProjectByNameOrId } from '../utils/projects.js';
import { diffProjectMetadata } from './diff-project.action-metadata.js';

/**
 * Service action to generate a diff between what would be generated and what currently exists.
 */
export const diffProjectAction = createServiceAction({
  ...diffProjectMetadata,
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
  writeCliOutput: (output, input) => {
    if (!output.hasDifferences) {
      console.info(chalk.green('✓ No differences found across all packages'));
      return;
    }

    console.info(
      chalk.bold(
        `Found differences in ${output.totalDiffs} file(s) across ${output.packageResults.length} package(s):`,
      ),
    );

    for (const packageResult of output.packageResults) {
      if (packageResult.hasDifferences) {
        console.info(
          chalk.bold(
            `\n=== ${packageResult.name} (${packageResult.packageDirectory}) ===`,
          ),
        );

        const formatted = input.compact
          ? formatCompactDiff(packageResult.diffSummary.files)
          : formatUnifiedDiff(packageResult.diffSummary.files);
        console.info(formatted);
      }
    }
  },
});
