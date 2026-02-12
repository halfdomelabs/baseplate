import chalk from 'chalk';

import type { DiffSummary, FileDiff } from './types.js';

/**
 * Formats a diff summary in compact format
 */
export function formatCompactDiff(summary: DiffSummary): string {
  const lines: string[] = [
    // Summary header
    chalk.bold('Diff Summary:'),
    chalk.green(`  Added: ${summary.addedFiles} files`),
    chalk.yellow(`  Modified: ${summary.modifiedFiles} files`),
    chalk.red(`  Deleted: ${summary.deletedFiles} files`),
    chalk.gray(`  Total: ${summary.totalFiles} files with differences`),
    '',
  ];

  if (summary.diffs.length === 0) {
    lines.push(chalk.green('✓ No differences found'));
    return lines.join('\n');
  }

  // Group files by type
  const byType = {
    added: summary.diffs.filter((d) => d.type === 'added'),
    modified: summary.diffs.filter((d) => d.type === 'modified'),
    deleted: summary.diffs.filter((d) => d.type === 'deleted'),
  };

  // Show added files
  if (byType.added.length > 0) {
    lines.push(chalk.green.bold('Added files:'));
    for (const diff of byType.added) {
      const indicator = diff.isBinary ? '(binary)' : '';
      lines.push(chalk.green(`  + ${diff.path} ${indicator}`));
    }
    lines.push('');
  }

  // Show modified files
  if (byType.modified.length > 0) {
    lines.push(chalk.yellow.bold('Modified files:'));
    for (const diff of byType.modified) {
      const indicator = diff.isBinary ? '(binary)' : '';
      lines.push(chalk.yellow(`  ~ ${diff.path} ${indicator}`));
    }
    lines.push('');
  }

  // Show deleted files
  if (byType.deleted.length > 0) {
    lines.push(chalk.red.bold('Deleted files:'));
    for (const diff of byType.deleted) {
      const indicator = diff.isBinary ? '(binary)' : '';
      lines.push(chalk.red(`  - ${diff.path} ${indicator}`));
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Formats a single file diff in unified format
 */
export function formatFileDiff(diff: FileDiff): string {
  const lines: string[] = [];

  // File header
  const typeIndicator =
    diff.type === 'added' ? '++' : diff.type === 'deleted' ? '--' : '~~';

  lines.push(chalk.bold(`${typeIndicator} ${diff.path}`));

  if (diff.isBinary) {
    lines.push(chalk.gray('Binary file'));
  } else if (diff.unifiedDiff) {
    // Apply colors to unified diff
    const diffLines = diff.unifiedDiff.split('\n');
    for (const line of diffLines) {
      if (line.startsWith('+++') || line.startsWith('---')) {
        lines.push(chalk.bold(line));
      } else if (line.startsWith('+')) {
        lines.push(chalk.green(line));
      } else if (line.startsWith('-')) {
        lines.push(chalk.red(line));
      } else if (line.startsWith('@@')) {
        lines.push(chalk.cyan(line));
      } else {
        lines.push(line);
      }
    }
  }

  return lines.join('\n');
}

/**
 * Formats a diff summary in unified format
 */
export function formatUnifiedDiff(summary: DiffSummary): string {
  const lines: string[] = [];

  if (summary.diffs.length === 0) {
    lines.push(chalk.green('✓ No differences found'));
    return lines.join('\n');
  }

  // Header
  lines.push(
    chalk.bold(`Found ${summary.totalFiles} files with differences:`),
    '',
  );

  // Show each diff
  for (const [index, diff] of summary.diffs.entries()) {
    if (index > 0) {
      lines.push('');
    }
    lines.push(formatFileDiff(diff));
  }

  return lines.join('\n');
}
