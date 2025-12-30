import fs from 'node:fs';
import path from 'node:path';

/**
 * Find the monorepo root by searching for pnpm-workspace.yaml in ancestor directories.
 * Stops at filesystem root.
 */
export function findMonorepoRoot(
  startDir: string = process.cwd(),
): string | undefined {
  let currentDir = path.resolve(startDir);
  const { root } = path.parse(currentDir);

  while (currentDir !== root) {
    const workspacePath = path.join(currentDir, 'pnpm-workspace.yaml');
    if (fs.existsSync(workspacePath)) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  return undefined;
}
