import chalk from 'chalk';

interface FileDiffEntry {
  path: string;
  status: 'added' | 'modified' | 'deleted';
  diff?: string;
}

/**
 * Formats a list of file diffs in compact format (no unified diff content).
 */
export function formatCompactDiff(files: FileDiffEntry[]): string {
  const added = files.filter((f) => f.status === 'added');
  const modified = files.filter((f) => f.status === 'modified');
  const deleted = files.filter((f) => f.status === 'deleted');

  const lines: string[] = [
    chalk.bold('Diff Summary:'),
    chalk.green(`  Added: ${added.length} files`),
    chalk.yellow(`  Modified: ${modified.length} files`),
    chalk.red(`  Deleted: ${deleted.length} files`),
    chalk.gray(`  Total: ${files.length} files with differences`),
    '',
  ];

  if (files.length === 0) {
    lines.push(chalk.green('✓ No differences found'));
    return lines.join('\n');
  }

  if (added.length > 0) {
    lines.push(chalk.green.bold('Added files:'));
    for (const file of added) {
      lines.push(chalk.green(`  + ${file.path}`));
    }
    lines.push('');
  }

  if (modified.length > 0) {
    lines.push(chalk.yellow.bold('Modified files:'));
    for (const file of modified) {
      lines.push(chalk.yellow(`  ~ ${file.path}`));
    }
    lines.push('');
  }

  if (deleted.length > 0) {
    lines.push(chalk.red.bold('Deleted files:'));
    for (const file of deleted) {
      lines.push(chalk.red(`  - ${file.path}`));
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Colorizes a unified diff string.
 */
export function colorizeUnifiedDiff(unifiedDiff: string): string {
  return unifiedDiff
    .split('\n')
    .map((line) => {
      if (line.startsWith('+++') || line.startsWith('---')) {
        return chalk.bold(line);
      }
      if (line.startsWith('+')) {
        return chalk.green(line);
      }
      if (line.startsWith('-')) {
        return chalk.red(line);
      }
      if (line.startsWith('@@')) {
        return chalk.cyan(line);
      }
      return line;
    })
    .join('\n');
}

/**
 * Formats a single file diff entry with colored status and optional unified diff.
 */
export function formatFileDiff(file: FileDiffEntry): string {
  const lines: string[] = [];

  const typeIndicator =
    file.status === 'added' ? '++' : file.status === 'deleted' ? '--' : '~~';

  const statusColor =
    file.status === 'added'
      ? chalk.green
      : file.status === 'deleted'
        ? chalk.red
        : chalk.yellow;

  lines.push(statusColor.bold(`${typeIndicator} ${file.path}`));

  if (file.diff) {
    lines.push(colorizeUnifiedDiff(file.diff));
  }

  return lines.join('\n');
}

/**
 * Formats a list of file diffs in unified format with colored output.
 */
export function formatUnifiedDiff(files: FileDiffEntry[]): string {
  if (files.length === 0) {
    return chalk.green('✓ No differences found');
  }

  const lines: string[] = [
    chalk.bold(`Found ${files.length} files with differences:`),
    '',
  ];

  for (const [index, file] of files.entries()) {
    if (index > 0) {
      lines.push('');
    }
    lines.push(formatFileDiff(file));
  }

  return lines.join('\n');
}
