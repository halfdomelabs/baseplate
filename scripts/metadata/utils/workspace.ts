import { glob } from 'glob';
import * as fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

export interface PackageInfo {
  name: string;
  path: string;
  packageJsonPath: string;
  packageJson: Record<string, unknown>;
  isPlugin: boolean;
  isReactPackage: boolean;
}

export async function findWorkspacePackages(
  rootDir: string,
): Promise<PackageInfo[]> {
  const workspaceYaml = path.join(rootDir, 'pnpm-workspace.yaml');
  const workspaceYamlContent = fs.readFileSync(workspaceYaml, 'utf8');
  const workspace = parse(workspaceYamlContent) as {
    packages: string[];
  };
  const workspacePatterns = workspace.packages;
  const packages: PackageInfo[] = [];

  for (const pattern of workspacePatterns) {
    const dirs = await glob(pattern, { cwd: rootDir });

    for (const dir of dirs) {
      const fullPath = path.join(rootDir, dir);
      const packageJsonPath = path.join(fullPath, 'package.json');

      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, 'utf8'),
        ) as {
          name: string;
          dependencies?: Record<string, string>;
          devDependencies?: Record<string, string>;
          peerDependencies?: Record<string, string>;
        };
        const isPlugin = dir.startsWith('plugins/');
        const isReactPackage =
          !!packageJson.dependencies?.react ||
          !!packageJson.devDependencies?.react ||
          !!packageJson.peerDependencies?.react;

        packages.push({
          name: packageJson.name || path.basename(dir),
          path: fullPath,
          packageJsonPath,
          packageJson,
          isPlugin,
          isReactPackage,
        });
      }
    }
  }

  return packages;
}

export function getPackageType(pkg: PackageInfo): 'plugin' | 'react' | 'node' {
  if (pkg.isPlugin) return 'plugin';
  if (pkg.isReactPackage) return 'react';
  return 'node';
}

export function isCreateProjectPackage(pkg: PackageInfo): boolean {
  return pkg.name === 'create-project' || pkg.path.includes('create-project');
}
