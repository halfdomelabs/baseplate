import { globby } from 'globby';
import fs from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'yaml';

import { findNearestAncestorFile } from './find-nearest-ancestor-file.js';
import { pathExists } from './fs.js';

export interface WorkspacePackage {
  name: string;
  directory: string;
}

interface PnpmWorkspace {
  packages?: string[];
}

async function parseWorkspaceConfig(
  workspaceConfigPath: string,
): Promise<PnpmWorkspace> {
  const workspaceContent = await fs.readFile(workspaceConfigPath, 'utf8');
  return parse(workspaceContent) as PnpmWorkspace;
}

async function findMatchingPackages(
  workspaceRoot: string,
  patterns: string[],
): Promise<WorkspacePackage[]> {
  const matchedDirectories = await globby(patterns, {
    cwd: workspaceRoot,
    absolute: true,
    gitignore: true,
    onlyDirectories: true,
  });

  const packagesWithNames = await Promise.all(
    matchedDirectories.map(async (directory) => {
      const packageJsonPath = path.join(directory, 'package.json');
      const packageJsonExists = await pathExists(packageJsonPath);
      if (!packageJsonExists) {
        return;
      }
      const packageJson = await fs.readFile(packageJsonPath, 'utf8');
      const packageJsonContent = JSON.parse(packageJson) as { name: string };
      if (!packageJsonContent.name) {
        return;
      }
      return {
        name: packageJsonContent.name,
        directory,
      };
    }),
  );

  return packagesWithNames.filter((p) => p !== undefined);
}

export async function getWorkspacePackages(
  startDir: string = process.cwd(),
): Promise<WorkspacePackage[]> {
  const workspaceConfigPath = findNearestAncestorFile(
    startDir,
    'pnpm-workspace.yaml',
  );

  if (!workspaceConfigPath) {
    throw new Error('Could not find pnpm workspace root');
  }

  const workspaceConfig = await parseWorkspaceConfig(workspaceConfigPath);

  if (!workspaceConfig.packages || !Array.isArray(workspaceConfig.packages)) {
    throw new Error(
      'Invalid workspace configuration: missing or invalid packages field',
    );
  }

  return findMatchingPackages(
    path.dirname(workspaceConfigPath),
    workspaceConfig.packages,
  );
}
